import { Badge } from "silicaui-react";
import { ColorVariantSizeGrid } from "../lib/ColorGrid";

export function BadgeDemo() {
    return (
        <ColorVariantSizeGrid
            Component={Badge}
            variants={["outline", "soft", "ghost", "dash"]}
        />
    );
}
