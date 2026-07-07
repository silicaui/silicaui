# silicaui-table

## 2.0.0

### Minor Changes

- a206f43: Add Position and Self align controls to the builder's Design panel, so a
  width/max-width-constrained node can be centered (or left/right-aligned via
  auto margins) and cross-axis aligned within a flex/grid parent, without
  dropping to the raw class field.

  Extend silicaui-mcp's `search_docs` tool to also match literal CSS class
  names and semantic color tokens, not just components/blocks/behaviors.

  Migrate the builder's default and studio-chrome theme presets from hex to
  OKLCH color tokens for perceptually consistent palettes.

### Patch Changes

- Updated dependencies [a206f43]
  - silicaui-react@2.0.0

## 1.1.1

### Patch Changes

- d8f6911: Align every Silica UI package on one version number, including the not-yet-released builder. The whole family now versions in lockstep (a single fixed changesets group) so this drift can't recur.
- Updated dependencies [d8f6911]
  - silicaui-react@1.1.1

## 1.0.0

### Patch Changes

- Updated dependencies
  - silicaui-react@0.2.0
