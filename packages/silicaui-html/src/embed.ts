/**
 * Shareable URL → provider EMBED URL, for the curated `Embed` component.
 *
 * `Embed` is the ONLY component that emits an `<iframe>` (an authored one still
 * downgrades to `<div>` — see element.ts), so this module is the whole gate
 * between "a URL someone pasted" and "a third-party frame on a published page".
 * It answers one question: is this a provider URL we can turn into a FRAMEABLE
 * player, and what is that player's URL and natural size? Anything else returns
 * `undefined` and the caller falls back to a plain link — never a raw iframe.
 *
 * Three rules earn their own emphasis, because breaking any of them ships a page
 * that looks right to whoever authored it and is broken for everyone else.
 *
 * 1. NEVER frame a URL the provider refuses to be framed in. A normal Google
 *    Maps page (`/maps/place/…`) is served `X-Frame-Options: SAMEORIGIN`, so an
 *    iframe pointed at it is a permanently blank box — strictly worse than the
 *    link it displaced, and easy for the author to miss when their own browser
 *    has the page cached.
 *
 * 2. CARRY the parts of the URL that decide WHAT plays and WHO may play it. The
 *    unlisted Vimeo hash is the sharp one: drop it and the embed plays for the
 *    signed-in owner and 401s for every visitor — the failure mode nobody
 *    catches before publishing. SoundCloud's `/s-…` secret segment and Apple's
 *    `?i=` episode selector are the same hazard (the second silently plays the
 *    whole album instead of the track). Start times and playlists are part of
 *    the address too.
 *
 * 3. DERIVE nothing that isn't in the URL. Several providers address their
 *    player by an internal id that appears nowhere in a shareable link —
 *    Bandcamp, Simplecast, Megaphone. `expand()` is pure and synchronous, so
 *    there is no looking it up. Those resolve only from the URL their own embed
 *    dialog produces, and a share URL falls back to a link rather than to a
 *    player that would 404.
 *
 * Parsing goes through `URL`, not a substring match, so `youtube.com` has to BE
 * the host rather than merely appear somewhere in the string.
 */

/** One provider the `Embed` component can frame. */
export interface EmbedProvider {
  /** Display name, e.g. "YouTube". */
  name: string;
  /** What it plays — lets a host group the list, and a coding agent pick one. */
  kind: "video" | "audio" | "podcast" | "map";
  /** A URL shape that resolves. Asserted to actually resolve by verify-embed.mjs. */
  example: string;
  /** Set when only the provider's OWN embed-dialog URL resolves, because the
   *  player id is absent from a shareable link (see rule 3). */
  embedUrlOnly?: boolean;
}

/**
 * Every provider `resolveEmbed` accepts, as data.
 *
 * This exists because the answer to "what can I paste into an Embed?" was
 * previously unanswerable from outside this file — the MCP catalog carries no
 * props for node-tree components, so a host or a coding agent building on
 * silicaui had no way to know a Spotify link would frame and a Bandcamp album
 * page would not. A list nobody can read is the same as no list.
 *
 * `verify-embed.mjs` asserts every `example` here still resolves AND that these
 * entries cover every host in `EMBED_URL` — so adding a provider to the resolver
 * without documenting it fails the probe, in both directions.
 */
export const EMBED_PROVIDERS: readonly EmbedProvider[] = [
  { name: "YouTube", kind: "video", example: "https://www.youtube.com/watch?v=VIDEO_ID" },
  { name: "Vimeo", kind: "video", example: "https://vimeo.com/123456789" },
  { name: "Google Maps", kind: "map", example: "https://www.google.com/maps/embed?pb=…", embedUrlOnly: true },
  { name: "Spotify", kind: "audio", example: "https://open.spotify.com/track/TRACK_ID" },
  { name: "SoundCloud", kind: "audio", example: "https://soundcloud.com/artist/track" },
  { name: "Apple Music", kind: "audio", example: "https://music.apple.com/us/album/name/1441164426" },
  { name: "Apple Podcasts", kind: "podcast", example: "https://podcasts.apple.com/us/podcast/name/id1200361736" },
  {
    name: "Bandcamp",
    kind: "audio",
    example: "https://bandcamp.com/EmbeddedPlayer/album=123456789/size=large/",
    embedUrlOnly: true,
  },
  { name: "Simplecast", kind: "podcast", example: "https://player.simplecast.com/EPISODE_ID", embedUrlOnly: true },
  { name: "Megaphone", kind: "podcast", example: "https://player.megaphone.fm/EPISODE_ID", embedUrlOnly: true },
  { name: "Transistor", kind: "podcast", example: "https://share.transistor.fm/e/EPISODE_ID", embedUrlOnly: true },
  {
    name: "Buzzsprout",
    kind: "podcast",
    example: "https://www.buzzsprout.com/123456/9876543?iframe=true",
    embedUrlOnly: true,
  },
];

/** A player we are willing to frame. */
export interface ResolvedEmbed {
  /** The URL an `<iframe src>` may point at. */
  url: string;
  /**
   * A literal height utility, for players with a FIXED design height — every
   * audio and podcast player. Video players size by aspect ratio instead and
   * leave this `undefined`. An author's explicit `ratio` still overrides it.
   *
   * A number here rather than a ratio because these players are chrome, not
   * picture: a Spotify track is 152px tall at any width, and putting it in a
   * 16:9 box (the old unconditional default) left a strip of player floating in
   * a tall empty rectangle.
   */
  height?: string;
}

/**
 * The ONLY (host, path) pairs an emitted embed `<iframe>` src may resolve to,
 * applied to the BUILT url as a last gate — so a parser bug widens nothing.
 *
 * Path-precise on purpose. A host-only allowlist is exactly what let any
 * `https://www.google.com/…` through as a "bare embed URL" and framed ordinary
 * map pages into blank boxes.
 */
const EMBED_URL = new RegExp(
  "^https://(?:" +
    [
      "www\\.youtube-nocookie\\.com/embed/",
      "player\\.vimeo\\.com/video/",
      "www\\.google\\.com/maps/embed(?:[/?]|$)",
      "open\\.spotify\\.com/embed/",
      "w\\.soundcloud\\.com/player/",
      "embed\\.music\\.apple\\.com/",
      "embed\\.podcasts\\.apple\\.com/",
      "bandcamp\\.com/EmbeddedPlayer/",
      "player\\.simplecast\\.com/",
      "player\\.megaphone\\.fm/",
      "share\\.transistor\\.fm/e/",
      "www\\.buzzsprout\\.com/",
    ].join("|") +
    ")",
);

/** Parse a possibly scheme-less authored URL. `undefined` for anything that
 *  isn't syntactically a URL, or isn't http(s) (`javascript:`, `data:`). */
function parse(raw: string): URL | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    // Pastes are routinely scheme-less ("youtu.be/x"), so default to https —
    // but ONLY when there is no scheme at all, so `javascript:` is rejected
    // below instead of being quietly turned into `https://javascript:…`.
    const u = new URL(/^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return u.protocol === "https:" || u.protocol === "http:" ? u : undefined;
  } catch {
    return undefined;
  }
}

/** A provider start-time (`90`, `90s`, `1m30s`, `1h2m3s`) as whole seconds. */
function seconds(raw: string | null | undefined): number | undefined {
  if (raw == null) return undefined;
  const v = raw.trim().toLowerCase();
  if (/^\d+$/.test(v)) return Number(v);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(v);
  if (!m || (m[1] == null && m[2] == null && m[3] == null)) return undefined;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

/** The start offset a URL asks for. YouTube writes `?t=`/`?start=`, Vimeo writes
 *  `#t=`; accept either from either — a paste is a paste. */
function startAt(u: URL): number | undefined {
  const hash = new URLSearchParams(u.hash.replace(/^#/, ""));
  const at = seconds(u.searchParams.get("t") ?? u.searchParams.get("start") ?? hash.get("t"));
  return at != null && at > 0 ? at : undefined;
}

/** Path segments, empties dropped. */
function segments(u: URL): string[] {
  return u.pathname.split("/").filter(Boolean);
}

// ─── video ──────────────────────────────────────────────────────────────────

const YT_ID = /^[\w-]{11}$/;
const YT_LIST = /^[\w-]{2,64}$/;

/**
 * YouTube → the privacy-friendly nocookie player.
 *
 * Every path form that addresses a video is accepted, not just `watch`: a
 * `/shorts/` link is what a phone's share sheet produces and is now the most
 * common paste of the lot, while `/live/` and `/v/` are what a stream and an old
 * embed hand out. All of them name the same 11-character id and all embed fine.
 */
function youtube(u: URL, host: string): ResolvedEmbed | undefined {
  const seg = segments(u);
  let id: string | undefined;
  if (host === "youtu.be") id = seg[0];
  else {
    const head = (seg[0] ?? "").toLowerCase();
    if (head === "watch") id = u.searchParams.get("v") ?? undefined;
    else if (head === "embed" || head === "shorts" || head === "live" || head === "v") id = seg[1];
  }
  // `/embed/videoseries` is the PLAYLIST player, not a video — and it happens to
  // be exactly 11 word characters, so it passes YT_ID unless excluded here.
  if (id != null && id.toLowerCase() === "videoseries") id = undefined;

  const rawList = u.searchParams.get("list");
  const list = rawList != null && YT_LIST.test(rawList) ? rawList : undefined;
  const video = id != null && YT_ID.test(id) ? id : undefined;
  // A playlist URL carries no video of its own: the player takes `videoseries`
  // in the id slot and plays the list from the top.
  if (!video && !list) return undefined;

  const params = new URLSearchParams();
  const start = startAt(u);
  if (start != null) params.set("start", String(start));
  if (list) params.set("list", list);
  const q = params.toString();
  return { url: `https://www.youtube-nocookie.com/embed/${video ?? "videoseries"}${q ? `?${q}` : ""}` };
}

/** An unlisted-video hash — hex in practice, kept loose since only Vimeo mints it. */
const VIMEO_HASH = /^[\w-]{4,64}$/;
/** Container paths that wrap a video id: `<name>/<id>` pairs to strip. */
const VIMEO_CONTAINER = new Set(["channels", "groups", "ondemand", "album", "showcase"]);

/**
 * Vimeo → the player, carrying the unlisted hash.
 *
 * A video's id is the same number however it was linked, but Vimeo hangs that
 * number off a dozen container paths (`/channels/<name>/<id>`,
 * `/groups/<name>/videos/<id>`, `/showcase/<n>/video/<id>`, …). Rather than
 * enumerate the products, strip container prefixes and require what remains to
 * START with the id — so a container nobody has heard of costs one entry, and a
 * container URL naming NO video (`/channels/staffpicks`) correctly resolves to
 * nothing, because it isn't a video.
 *
 * `h` is the privacy hash of an unlisted video. WITHOUT IT the player refuses
 * every viewer who is not the signed-in owner.
 */
function vimeo(u: URL): ResolvedEmbed | undefined {
  const rest = segments(u);
  for (;;) {
    const head = (rest[0] ?? "").toLowerCase();
    if (head === "video" || head === "videos") rest.shift();
    else if (rest.length >= 2 && VIMEO_CONTAINER.has(head)) rest.splice(0, 2);
    else break;
  }
  const id = rest[0];
  if (id == null || !/^\d+$/.test(id)) return undefined;
  // The unlisted hash is the segment after the id (`vimeo.com/<id>/<hash>`), or
  // the `h` query param on a URL that is already a player URL.
  const rawHash = rest[1] ?? u.searchParams.get("h") ?? undefined;
  const hash = rawHash != null && VIMEO_HASH.test(rawHash) ? rawHash : undefined;
  const start = startAt(u);
  return {
    url:
      `https://player.vimeo.com/video/${id}` +
      (hash ? `?h=${hash}` : "") +
      (start != null ? `#t=${start}s` : ""),
  };
}

/**
 * Google Maps → only a URL that is ALREADY the embed form.
 *
 * There is no way to turn an ordinary map page into an embed without an Embed
 * API key we do not have, and framing one anyway produces the blank reserved box
 * of rule 1. So an ordinary maps link resolves to nothing and the caller renders
 * it as a link, which at least goes somewhere when clicked.
 */
function maps(u: URL): ResolvedEmbed | undefined {
  if (u.pathname !== "/maps/embed" && !u.pathname.startsWith("/maps/embed/")) return undefined;
  return { url: `https://www.google.com/maps/embed${u.pathname.slice("/maps/embed".length)}${u.search}` };
}

// ─── music & podcasts ───────────────────────────────────────────────────────
//
// Every player below is fixed-height chrome rather than picture, so each returns
// a `height` and none of them wants the 16:9 box a video gets. The heights are
// the providers' own published defaults; an author's explicit `ratio` overrides.

const SPOTIFY_KIND = new Set(["track", "album", "playlist", "artist", "show", "episode", "audiobook"]);
const SPOTIFY_ID = /^[A-Za-z0-9]{16,32}$/;
/** Spotify's published embed heights: a compact row for one item, a full panel
 *  for anything with a tracklist. `show`/`episode` are the PODCAST kinds. */
const SPOTIFY_HEIGHT: Record<string, string> = { track: "h-[152px]", episode: "h-[232px]" };

function spotify(u: URL): ResolvedEmbed | undefined {
  // `/intl-de/track/…` is the localized share path; the locale is display-only.
  const seg = segments(u).filter((s) => !/^intl-[a-z]{2}$/i.test(s));
  // An already-embed URL carries the same (kind, id) one segment deeper.
  const rest = (seg[0] ?? "").toLowerCase() === "embed" ? seg.slice(1) : seg;
  const kind = (rest[0] ?? "").toLowerCase();
  const id = rest[1];
  if (!SPOTIFY_KIND.has(kind) || id == null || !SPOTIFY_ID.test(id)) return undefined;
  // `si=` is a share-ATTRIBUTION token, not an access token — dropping it is
  // correct, and keeping it would leak the sharer's id onto a public page.
  const start = startAt(u);
  return {
    url: `https://open.spotify.com/embed/${kind}/${id}${start != null ? `?t=${start}` : ""}`,
    height: SPOTIFY_HEIGHT[kind] ?? "h-[352px]",
  };
}

/**
 * SoundCloud → the widget, which takes the PERMALINK as a parameter rather than
 * an id. That is what makes the unlisted case work for free: SoundCloud's
 * private-share form is an extra `/s-XXXXXXXX` path segment, so keeping the path
 * intact carries the secret — drop it and a private track 404s for everyone but
 * the uploader.
 *
 * The widget has no documented start-position parameter for a single track (its
 * `start_track` selects a track within a SET), so a `?t=` on a SoundCloud URL is
 * deliberately not translated rather than emitted as something that looks
 * supported and silently does nothing.
 */
function soundcloud(u: URL): ResolvedEmbed | undefined {
  // Already a widget URL — keep the caller's own parameters.
  if (u.hostname.toLowerCase() === "w.soundcloud.com") {
    if (!u.pathname.startsWith("/player")) return undefined;
    return { url: `https://w.soundcloud.com/player/${u.search}`, height: "h-[166px]" };
  }
  const seg = segments(u);
  // `/<user>` alone is a profile, not a player.
  if (seg.length < 2) return undefined;
  const isSet = (seg[1] ?? "").toLowerCase() === "sets";
  const params = new URLSearchParams({ url: `https://soundcloud.com/${seg.join("/")}` });
  return { url: `https://w.soundcloud.com/player/?${params}`, height: isSet ? "h-[450px]" : "h-[166px]" };
}

const APPLE_MUSIC_KIND = new Set(["album", "playlist", "song", "music-video", "artist", "station"]);

/**
 * Apple Music / Apple Podcasts → the same path on Apple's embed host. Apple
 * keeps the storefront, slug and id identical between the two, so nothing needs
 * re-deriving — but `?i=` does need carrying: it selects ONE song or episode out
 * of an album or show, and without it the embed silently becomes the whole
 * container. That is the wrong thing playing, not a smaller thing.
 */
function apple(u: URL, podcasts: boolean): ResolvedEmbed | undefined {
  const seg = segments(u);
  const kind = podcasts
    ? seg.some((s) => s.toLowerCase() === "podcast")
    : seg.some((s) => APPLE_MUSIC_KIND.has(s.toLowerCase()));
  if (!kind) return undefined;
  const item = u.searchParams.get("i");
  const one = item != null && /^\d+$/.test(item);
  const host = podcasts ? "embed.podcasts.apple.com" : "embed.music.apple.com";
  const single = podcasts
    ? one
    : one || seg.some((s) => s.toLowerCase() === "song" || s.toLowerCase() === "music-video");
  return {
    url: `https://${host}/${seg.join("/")}${one ? `?i=${item}` : ""}`,
    height: single ? "h-[175px]" : "h-[450px]",
  };
}

/**
 * Bandcamp → only an already-embed URL.
 *
 * Bandcamp's player is addressed by a numeric album/track id that appears
 * nowhere in a shareable album URL — only their own embed dialog knows it, and
 * rule 3 says we do not go looking. So an artist page falls back to a link.
 */
function bandcamp(u: URL): ResolvedEmbed | undefined {
  if (!/^\/EmbeddedPlayer(?:\/|$)/i.test(u.pathname)) return undefined;
  const small = /(?:^|\/)size=small(?:\/|$)/i.test(u.pathname);
  return { url: `https://bandcamp.com${u.pathname}${u.search}`, height: small ? "h-[120px]" : "h-[470px]" };
}

/**
 * The dedicated podcast hosts, all of which follow rule 3: their player is keyed
 * by an internal episode id that a listener-facing episode page does not carry,
 * so each accepts the URL its own "embed" button produces and nothing else. A
 * plain episode-page URL falls back to a link.
 */
function podcastHost(u: URL, host: string): ResolvedEmbed | undefined {
  const seg = segments(u);
  if (host === "player.simplecast.com" && seg.length >= 1) {
    return { url: `https://player.simplecast.com/${seg.join("/")}${u.search}`, height: "h-[200px]" };
  }
  if (host === "player.megaphone.fm" && seg.length >= 1) {
    return { url: `https://player.megaphone.fm/${seg.join("/")}${u.search}`, height: "h-[200px]" };
  }
  if (host === "share.transistor.fm" && (seg[0] ?? "").toLowerCase() === "e" && seg.length >= 2) {
    return { url: `https://share.transistor.fm/e/${seg.slice(1).join("/")}${u.search}`, height: "h-[180px]" };
  }
  // Buzzsprout serves the episode page AND the player off the same path; the
  // player is the `iframe=true` form its embed dialog produces.
  if (host === "buzzsprout.com" && seg.length >= 2 && u.searchParams.get("iframe") === "true") {
    return { url: `https://www.buzzsprout.com/${seg.join("/")}${u.search}`, height: "h-[200px]" };
  }
  return undefined;
}

// ─── dispatch ───────────────────────────────────────────────────────────────

/**
 * Map an authored URL to a safe, allowlisted, FRAMEABLE player — or `undefined`
 * if it is not one, in which case the caller must fall back to a link and never
 * emit an iframe.
 */
export function resolveEmbed(url: string): ResolvedEmbed | undefined {
  // `spotify:track:<id>` is what the desktop app's "Copy Spotify URI" yields;
  // normalize it to the web URL the rest of this understands.
  const uri = /^spotify:([a-z]+):([A-Za-z0-9]+)$/i.exec(url.trim());
  const u = parse(uri ? `https://open.spotify.com/${uri[1]}/${uri[2]}` : url);
  if (!u) return undefined;
  // `m.` is a mobile share host and `www.` is noise; neither changes the target.
  const bare = u.hostname.toLowerCase().replace(/^(?:www|m)\./, "");
  const resolved =
    bare === "youtube.com" || bare === "youtube-nocookie.com" || bare === "music.youtube.com" || bare === "youtu.be"
      ? youtube(u, bare)
      : bare === "vimeo.com" || bare === "player.vimeo.com"
        ? vimeo(u)
        : bare === "google.com"
          ? maps(u)
          : bare === "open.spotify.com"
            ? spotify(u)
            : bare === "soundcloud.com" || bare === "w.soundcloud.com"
              ? soundcloud(u)
              : bare === "music.apple.com"
                ? apple(u, false)
                : bare === "podcasts.apple.com"
                  ? apple(u, true)
                  : bare === "bandcamp.com"
                    ? bandcamp(u)
                    : podcastHost(u, bare);
  return resolved && EMBED_URL.test(resolved.url) ? resolved : undefined;
}
