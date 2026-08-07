// The EMBED PROVIDER contract — every URL a person might paste into an `Embed`
// resolves to a player that actually plays, or to nothing at all (so the caller
// renders a link).
//
// Embed is the one component that emits an <iframe>, and its failures are the
// quiet kind: the author pastes a URL, sees a player in the builder, publishes,
// and the defect only exists for OTHER people. An unlisted Vimeo link without
// its hash plays for the signed-in owner and 401s for every visitor. A Google
// Maps page URL is framed and then refused by the browser, so the visitor gets a
// reserved blank rectangle. A dropped `?i=` on Apple Music silently plays the
// whole album instead of the track. None of those throw, none of them fail a
// type check, and none of them look wrong to whoever shipped them.
//
// So this asserts the mapping directly (URL in → player URL out) rather than
// only eyeballing markup, and covers the three shapes of the bug at once:
//   • NOT FRAMED but should be   — Shorts, /live/, Vimeo channels, Spotify, …
//   • FRAMED but must not be     — maps pages, Bandcamp artist pages, look-alike hosts
//   • FRAMED but wrong           — dropped unlisted hash / ?i= / start time / playlist
//
// Run against built output: `pnpm --filter @wizeworks/silicaui-html build && node verify-embed.mjs`.
import { EMBED_PROVIDERS, resolveEmbed, toHtml } from "./dist/index.js";

let failures = 0;
let checks = 0;
function check(label, cond, detail) {
  checks++;
  if (!cond) {
    failures++;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

/** The url a provider URL resolves to (or undefined). */
const url = (input) => resolveEmbed(input)?.url;

function frames(label, input, expected) {
  const got = url(input);
  check(label, got === expected, `${input}\n      got      ${got}\n      expected ${expected}`);
}

function doesNotFrame(label, input) {
  const got = resolveEmbed(input);
  check(label, got === undefined, `${input} resolved to ${got?.url} — it must fall back to a link`);
}

function height(label, input, expected) {
  const got = resolveEmbed(input)?.height;
  check(label, got === expected, `${input}\n      got      ${got}\n      expected ${expected}`);
}

const YT = "dQw4w9WgXcQ";
const NOCOOKIE = `https://www.youtube-nocookie.com/embed/${YT}`;

console.log("YouTube — every path form that names a video");
frames("watch", `https://www.youtube.com/watch?v=${YT}`, NOCOOKIE);
frames("youtu.be", `https://youtu.be/${YT}`, NOCOOKIE);
frames("embed", `https://www.youtube.com/embed/${YT}`, NOCOOKIE);
frames("nocookie", `https://www.youtube-nocookie.com/embed/${YT}`, NOCOOKIE);
// The three that shipped unframed. Shorts is the one that matters most — it is
// what a phone's share sheet produces, so it is the most common paste of all.
frames("shorts", `https://www.youtube.com/shorts/${YT}`, NOCOOKIE);
frames("live", `https://www.youtube.com/live/${YT}`, NOCOOKIE);
frames("/v/", `https://www.youtube.com/v/${YT}`, NOCOOKIE);
frames("m. mobile host", `https://m.youtube.com/watch?v=${YT}`, NOCOOKIE);
frames("music.youtube", `https://music.youtube.com/watch?v=${YT}`, NOCOOKIE);
frames("scheme-less paste", `youtu.be/${YT}`, NOCOOKIE);
doesNotFrame("a channel page names no video", "https://www.youtube.com/@someone");

console.log("YouTube — start time and playlist survive the trip");
frames("?t= seconds", `https://www.youtube.com/watch?v=${YT}&t=90`, `${NOCOOKIE}?start=90`);
frames("?t= with s suffix", `https://youtu.be/${YT}?t=90s`, `${NOCOOKIE}?start=90`);
frames("?t=1m30s", `https://youtu.be/${YT}?t=1m30s`, `${NOCOOKIE}?start=90`);
frames("?t=1h2m3s", `https://www.youtube.com/watch?v=${YT}&t=1h2m3s`, `${NOCOOKIE}?start=3723`);
frames("?start=", `https://www.youtube.com/watch?v=${YT}&start=42`, `${NOCOOKIE}?start=42`);
frames("#t= fragment", `https://www.youtube.com/watch?v=${YT}#t=42`, `${NOCOOKIE}?start=42`);
frames("t=0 is not a start", `https://www.youtube.com/watch?v=${YT}&t=0`, NOCOOKIE);
frames("video in a playlist", `https://www.youtube.com/watch?v=${YT}&list=PLtest123`, `${NOCOOKIE}?list=PLtest123`);
frames(
  "playlist-only URL",
  "https://www.youtube.com/playlist?list=PLtest123",
  "https://www.youtube-nocookie.com/embed/videoseries?list=PLtest123",
);
frames(
  "already the playlist player",
  "https://www.youtube.com/embed/videoseries?list=PLtest123",
  "https://www.youtube-nocookie.com/embed/videoseries?list=PLtest123",
);
frames(
  "start + playlist together",
  `https://www.youtube.com/watch?v=${YT}&list=PLtest123&t=90`,
  `${NOCOOKIE}?start=90&list=PLtest123`,
);

const V = "123456789";
const PLAYER = `https://player.vimeo.com/video/${V}`;

console.log("Vimeo — every container path resolves to the same video");
frames("bare", `https://vimeo.com/${V}`, PLAYER);
frames("/video/", `https://vimeo.com/video/${V}`, PLAYER);
frames("player URL", `https://player.vimeo.com/video/${V}`, PLAYER);
frames("/channels/", `https://vimeo.com/channels/staffpicks/${V}`, PLAYER);
frames("/groups/", `https://vimeo.com/groups/motion/videos/${V}`, PLAYER);
frames("/album/", `https://vimeo.com/album/54321/video/${V}`, PLAYER);
frames("/showcase/", `https://vimeo.com/showcase/54321/video/${V}`, PLAYER);
frames("/ondemand/", `https://vimeo.com/ondemand/thefilm/${V}`, PLAYER);
// A container that names no video is NOT a video — resolving it to the
// container's own id would frame a player for something that cannot play.
doesNotFrame("a channel page names no video", "https://vimeo.com/channels/staffpicks");
doesNotFrame("a user page names no video", "https://vimeo.com/someuser");

console.log("Vimeo — the unlisted hash (drop it and only the owner can watch)");
frames("path form", `https://vimeo.com/${V}/abcdef1234`, `${PLAYER}?h=abcdef1234`);
frames("?h= form", `https://player.vimeo.com/video/${V}?h=abcdef1234`, `${PLAYER}?h=abcdef1234`);
frames("hash + start", `https://vimeo.com/${V}/abcdef1234#t=30`, `${PLAYER}?h=abcdef1234#t=30s`);

console.log("Vimeo — start time");
frames("#t=1m30s", `https://vimeo.com/${V}#t=1m30s`, `${PLAYER}#t=90s`);
frames("?t=90", `https://vimeo.com/${V}?t=90`, `${PLAYER}#t=90s`);

console.log("Google Maps — only the embed form may be framed");
const PB = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624";
frames("embed?pb=", PB, PB);
frames(
  "Embed API v1",
  "https://www.google.com/maps/embed/v1/place?key=K&q=Eiffel+Tower",
  "https://www.google.com/maps/embed/v1/place?key=K&q=Eiffel+Tower",
);
// The reported bug: a host-only allowlist let ANY google.com URL through as a
// "bare embed URL", so an ordinary map page was framed — and every visitor's
// browser refused it, leaving reserved blank space where a link should be.
doesNotFrame("a place page", "https://www.google.com/maps/place/Eiffel+Tower/@48.85,2.29,17z");
doesNotFrame("a coordinate page", "https://www.google.com/maps/@48.85,2.29,17z");
doesNotFrame("a directions page", "https://www.google.com/maps/dir/A/B");
doesNotFrame("maps.google.com", "https://maps.google.com/maps?q=Eiffel");
doesNotFrame("a short link", "https://maps.app.goo.gl/abcdefg");
doesNotFrame("any other google page", "https://www.google.com/search?q=cats");

const TRACK = "4cOdK2wGLETKBW3PvgPWqT";

console.log("Spotify — music AND podcasts");
frames("track", `https://open.spotify.com/track/${TRACK}?si=abc123`, `https://open.spotify.com/embed/track/${TRACK}`);
frames("localized path", `https://open.spotify.com/intl-de/track/${TRACK}`, `https://open.spotify.com/embed/track/${TRACK}`);
frames("already embed", `https://open.spotify.com/embed/track/${TRACK}`, `https://open.spotify.com/embed/track/${TRACK}`);
frames("desktop URI", `spotify:track:${TRACK}`, `https://open.spotify.com/embed/track/${TRACK}`);
frames("album", `https://open.spotify.com/album/${TRACK}`, `https://open.spotify.com/embed/album/${TRACK}`);
frames("playlist", `https://open.spotify.com/playlist/${TRACK}`, `https://open.spotify.com/embed/playlist/${TRACK}`);
frames("podcast show", `https://open.spotify.com/show/${TRACK}`, `https://open.spotify.com/embed/show/${TRACK}`);
frames("podcast episode", `https://open.spotify.com/episode/${TRACK}`, `https://open.spotify.com/embed/episode/${TRACK}`);
frames("start position", `https://open.spotify.com/episode/${TRACK}?t=90`, `https://open.spotify.com/embed/episode/${TRACK}?t=90`);
doesNotFrame("a user page", "https://open.spotify.com/user/someone");
// `si=` is share ATTRIBUTION, not access — carrying it would publish the
// sharer's id onto a public page for no gain.
check("si= is not carried into the embed", !url(`https://open.spotify.com/track/${TRACK}?si=abc123`).includes("si="));

console.log("SoundCloud — the secret link is the unlisted case");
frames(
  "track",
  "https://soundcloud.com/artist/track-name",
  "https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fartist%2Ftrack-name",
);
// SoundCloud's private-share form is an extra `/s-…` segment on the permalink,
// and the widget takes the permalink whole — so keeping the path intact is what
// makes a private track play for a visitor at all.
check(
  "secret token survives",
  url("https://soundcloud.com/artist/track-name/s-AbCdEfGh12")?.includes("%2Fs-AbCdEfGh12"),
  url("https://soundcloud.com/artist/track-name/s-AbCdEfGh12"),
);
frames(
  "set / playlist",
  "https://soundcloud.com/artist/sets/the-album",
  "https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fartist%2Fsets%2Fthe-album",
);
doesNotFrame("a profile is not a player", "https://soundcloud.com/artist");

console.log("Apple Music / Apple Podcasts");
frames(
  "album",
  "https://music.apple.com/us/album/abbey-road/1441164426",
  "https://embed.music.apple.com/us/album/abbey-road/1441164426",
);
// `?i=` selects ONE song out of the album. Dropping it does not shrink the
// embed, it plays a different thing entirely.
frames(
  "song within an album (?i=)",
  "https://music.apple.com/us/album/abbey-road/1441164426?i=1441164429",
  "https://embed.music.apple.com/us/album/abbey-road/1441164426?i=1441164429",
);
frames(
  "playlist",
  "https://music.apple.com/us/playlist/todays-hits/pl.abc123",
  "https://embed.music.apple.com/us/playlist/todays-hits/pl.abc123",
);
frames(
  "podcast show",
  "https://podcasts.apple.com/us/podcast/the-daily/id1200361736",
  "https://embed.podcasts.apple.com/us/podcast/the-daily/id1200361736",
);
frames(
  "podcast episode (?i=)",
  "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000650000000",
  "https://embed.podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000650000000",
);
// Apple's embed DOES render an artist card, so an artist URL is a real player
// rather than a fallback — unlike Vimeo/YouTube, where a channel names no media.
frames(
  "artist",
  "https://music.apple.com/us/artist/the-beatles/136975",
  "https://embed.music.apple.com/us/artist/the-beatles/136975",
);
doesNotFrame("a browse page names no media", "https://music.apple.com/us/browse");

console.log("Bandcamp + the podcast hosts — embed-dialog URLs only");
// Each of these addresses its player by an internal id that a listener-facing
// page does not carry, and `expand()` is pure/sync so there is no looking it up.
// Accepting only the embed form is the honest posture: a share URL becomes a
// link that works, not a player that 404s.
frames(
  "Bandcamp player",
  "https://bandcamp.com/EmbeddedPlayer/album=123456789/size=large/",
  "https://bandcamp.com/EmbeddedPlayer/album=123456789/size=large/",
);
doesNotFrame("a Bandcamp album page", "https://artist.bandcamp.com/album/the-record");
frames("Simplecast player", "https://player.simplecast.com/abcd-1234", "https://player.simplecast.com/abcd-1234");
doesNotFrame("a Simplecast episode page", "https://theshow.simplecast.com/episodes/my-episode");
frames("Megaphone player", "https://player.megaphone.fm/ADL1234567890", "https://player.megaphone.fm/ADL1234567890");
frames("Transistor player", "https://share.transistor.fm/e/abc12345", "https://share.transistor.fm/e/abc12345");
frames(
  "Buzzsprout player",
  "https://www.buzzsprout.com/123456/9876543?client_source=small_player&iframe=true",
  "https://www.buzzsprout.com/123456/9876543?client_source=small_player&iframe=true",
);
doesNotFrame("a Buzzsprout episode page", "https://www.buzzsprout.com/123456/9876543");

console.log("Player heights — audio is fixed-height chrome, video is a picture");
height("YouTube has no fixed height", `https://youtu.be/${YT}`, undefined);
height("Vimeo has no fixed height", `https://vimeo.com/${V}`, undefined);
height("Spotify track", `https://open.spotify.com/track/${TRACK}`, "h-[152px]");
height("Spotify episode", `https://open.spotify.com/episode/${TRACK}`, "h-[232px]");
height("Spotify playlist", `https://open.spotify.com/playlist/${TRACK}`, "h-[352px]");
height("SoundCloud track", "https://soundcloud.com/artist/track-name", "h-[166px]");
height("SoundCloud set", "https://soundcloud.com/artist/sets/the-album", "h-[450px]");
height("Apple Music album", "https://music.apple.com/us/album/abbey-road/1441164426", "h-[450px]");
height("Apple Music song", "https://music.apple.com/us/album/abbey-road/1441164426?i=1441164429", "h-[175px]");

console.log("Never framed — anything that is not a known provider");
for (const bad of [
  "javascript:alert(1)",
  "data:text/html,<script>alert(1)</script>",
  "https://example.com/video.mp4",
  // A substring match would have framed these: the provider name appears in the
  // string but is not the host. Parsing through `URL` is what makes them safe.
  `https://evil.com/?u=https://www.youtube.com/watch?v=${YT}`,
  `https://youtube.com.evil.com/watch?v=${YT}`,
  `https://notvimeo.com/${V}`,
  "https://www.google.com.evil.com/maps/embed?pb=1",
  "",
  "   ",
  "not a url at all",
]) {
  doesNotFrame(JSON.stringify(bad.slice(0, 48)), bad);
}

console.log("Every resolved player lands on an allowlisted host");
// Plain data, so the provider-list drift check below can use the same set
// instead of picking a regex apart.
const ALLOWED_HOSTS = [
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "www.google.com",
  "open.spotify.com",
  "w.soundcloud.com",
  "embed.music.apple.com",
  "embed.podcasts.apple.com",
  "bandcamp.com",
  "player.simplecast.com",
  "player.megaphone.fm",
  "share.transistor.fm",
  "www.buzzsprout.com",
];
const ALLOWED = new RegExp(`^https://(?:${ALLOWED_HOSTS.map((h) => h.replace(/\./g, "\\.")).join("|")})/`);
for (const input of [
  `https://www.youtube.com/shorts/${YT}`,
  `https://vimeo.com/${V}/abcdef1234`,
  PB,
  `https://open.spotify.com/episode/${TRACK}`,
  "https://soundcloud.com/artist/track-name",
  "https://music.apple.com/us/album/abbey-road/1441164426",
  "https://podcasts.apple.com/us/podcast/the-daily/id1200361736",
  "https://bandcamp.com/EmbeddedPlayer/album=123/size=large/",
  "https://player.simplecast.com/abcd-1234",
  "https://player.megaphone.fm/ADL1234567890",
  "https://share.transistor.fm/e/abc12345",
  "https://www.buzzsprout.com/1/2?iframe=true",
]) {
  check(`allowlisted: ${input.slice(0, 52)}`, ALLOWED.test(url(input)), url(input));
}

// ── the published provider list ─────────────────────────────────────────────
// `EMBED_PROVIDERS` is the only machine-readable answer to "what can I paste
// into an Embed?" — the MCP catalog carries no props for node-tree components,
// so it is what a host or a coding agent reads. A stale list is worse than none:
// it would confidently name a provider that resolves to a link. So it is checked
// in BOTH directions — every documented example still resolves, and every host
// the resolver can emit is documented by at least one entry.
console.log("The published provider list matches the resolver");
// Placeholder ids stand in for real ones, so an example is checked as a URL
// SHAPE rather than as a literal.
const concrete = (example) =>
  example
    .replace("VIDEO_ID", YT)
    .replace("TRACK_ID", TRACK)
    .replace("EPISODE_ID", "abc12345")
    .replace("?pb=…", "?pb=!1m18!1m12");

const documentedHosts = new Set();
for (const p of EMBED_PROVIDERS) {
  const resolved = url(concrete(p.example));
  check(`${p.name}: the documented example resolves`, resolved !== undefined, concrete(p.example));
  if (resolved) documentedHosts.add(new URL(resolved).hostname);
}
// The other direction: a provider added to the resolver but left out of the
// published list would leave a host nothing documents.
for (const host of ALLOWED_HOSTS) {
  check(`${host} is named in EMBED_PROVIDERS`, documentedHosts.has(host), `documented: ${[...documentedHosts].join(", ")}`);
}
check(
  "no provider is documented twice",
  new Set(EMBED_PROVIDERS.map((p) => p.name)).size === EMBED_PROVIDERS.length,
);

// ── the rendered component ──────────────────────────────────────────────────
console.log("The rendered Embed");
const render = (props) => toHtml({ kind: "component", component: "Embed", props });

const empty = render({});
// The reported bug: this hint is BUILDER copy and it was being published to
// visitors verbatim. Canvas affordances belong to the canvas (Canvas.tsx draws
// one), and an unconfigured embed must not reserve space on a live page either.
check("an unset url publishes no builder copy", !/Add a/i.test(empty), empty);
check("an unset url publishes no iframe", !empty.includes("<iframe"), empty);
check("an unset url reserves no aspect box", !empty.includes("aspect-"), empty);

const mapPage = render({ url: "https://www.google.com/maps/place/Eiffel+Tower/@48.85,2.29,17z" });
check("an unframeable URL renders a link", mapPage.includes("<a ") && !mapPage.includes("<iframe"), mapPage);
check("…and reserves no empty player box", !mapPage.includes("aspect-"), mapPage);

const video = render({ url: `https://www.youtube.com/shorts/${YT}` });
check("a video player gets the 16:9 frame", video.includes("aspect-video"), video);
check("…and points at nocookie", video.includes("youtube-nocookie.com/embed/"), video);

const audio = render({ url: `https://open.spotify.com/track/${TRACK}` });
check("an audio player gets its own height", audio.includes("h-[152px]"), audio);
check("…and NOT the 16:9 box", !audio.includes("aspect-video"), audio);

const authored = render({ url: `https://open.spotify.com/track/${TRACK}`, ratio: "square" });
check("an authored ratio still wins", authored.includes("aspect-square") && !authored.includes("h-[152px]"), authored);

// "auto" is what the builder's ratio control writes for "let the provider
// decide" — it must fall through to the player's own height, not to 16:9.
const auto = render({ url: `https://open.spotify.com/track/${TRACK}`, ratio: "auto" });
check("ratio:auto defers to the provider", auto.includes("h-[152px]") && !auto.includes("aspect-"), auto);
const autoVideo = render({ url: `https://youtu.be/${YT}`, ratio: "auto" });
check("ratio:auto on video is still 16:9", autoVideo.includes("aspect-video"), autoVideo);

// `&` inside an attribute value must be escaped or the markup is invalid — and
// a playlist embed is the first URL here to carry two parameters.
const multi = render({ url: `https://www.youtube.com/watch?v=${YT}&list=PLtest123&t=90` });
check("multi-param src is entity-escaped", multi.includes("start=90&amp;list=PLtest123"), multi);

console.log(
  failures === 0
    ? `\n✅ embed: ${checks} checks passed`
    : `\n❌ embed: ${failures} of ${checks} checks failed`,
);
process.exit(failures === 0 ? 0 : 1);
