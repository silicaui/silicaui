import * as React from "react";
import { cx } from "./lib/cx";
import { useSilicaClass } from "./lib/config";
import type { SilicaColor, SilicaSize } from "./lib/tokens";

export type AvatarColor = SilicaColor;

export type AvatarSize = SilicaSize;

export type AvatarShape = "circle" | "rounded";

export type AvatarStatus = "online" | "offline";

export interface AvatarProps
  // Omit the native string `color` so our token union wins.
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color"> {
  /** Fallback-chip + ring color; maps to `avatar-<color>`. */
  color?: AvatarColor;
  /** Default `md`. */
  size?: AvatarSize;
  /** `circle` (default) or a `rounded` square. */
  shape?: AvatarShape;
  /** Draw an accent ring with a base-100 gap. */
  ring?: boolean;
  /** Presence dot in the corner. */
  status?: AvatarStatus;
  /** Photo URL. If it fails to load, the fallback `children` show instead. */
  src?: string;
  /** Accessible label for the photo / the initials fallback. */
  alt?: string;
}

/**
 * Silica Avatar — a photo, or an initials/icon fallback on a colored chip.
 *
 *   <Avatar src={url} alt="Jane Doe">JD</Avatar>   // photo, falls back to "JD"
 *   <Avatar color="primary" alt="Ada Lovelace">AL</Avatar>   // initials chip
 *   <Avatar color="accent"><UserIcon /></Avatar>            // icon fallback
 *
 * `children` are the fallback shown when there's no `src` or the image errors.
 * When falling back to initials with an `alt`, the container is exposed as an
 * `img` with that label so assistive tech announces the person, not "JD".
 */
export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  function Avatar(
    { color, size = "md", shape = "circle", ring = false, status, src, alt, className, children, ...rest },
    ref,
  ) {
    const sc = useSilicaClass();
    const [failed, setFailed] = React.useState(false);
    // A new src gets a fresh chance to load before we fall back again.
    React.useEffect(() => setFailed(false), [src]);
    const showImg = Boolean(src) && !failed;

    const classes = cx(
      sc("avatar"),
      color && sc(`avatar-${color}`),
      size !== "md" && sc(`avatar-${size}`),
      shape === "rounded" && sc("avatar-rounded"),
      ring && sc("avatar-ring"),
      status && sc(`avatar-${status}`),
      className,
    );

    return (
      <span
        ref={ref}
        className={classes}
        // Label the initials fallback so it reads as the named person.
        role={!showImg && alt ? "img" : undefined}
        aria-label={!showImg ? alt : undefined}
        {...rest}
      >
        {showImg ? (
          <img src={src} alt={alt ?? ""} onError={() => setFailed(true)} />
        ) : (
          children
        )}
      </span>
    );
  },
);

/** Overlapping row of Avatars (`<Avatar>` children stack with a base-100 gap). */
export const AvatarGroup = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(function AvatarGroup({ className, ...rest }, ref) {
  const sc = useSilicaClass();
  return (
    <span ref={ref} className={cx(sc("avatar-group"), className)} {...rest} />
  );
});
