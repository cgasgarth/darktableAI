# darktableAI

darktableAI is a Bun + TypeScript CLI for AI-assisted photo editing workflows built on top of darktable. It turns a strict JSON `DevelopRecipe` into a generated darktable XMP sidecar, renders previews through `darktable-cli`, and writes manifests and artifacts that agents can consume directly.

## Status

This repository now has the first live-control foundation slices merged, but it is not feature-complete yet.

What exists today:
- a CLI-first workflow for capabilities discovery, smoke rendering, and preview rendering
- a strict `DevelopRecipe` contract with explicit validation
- deterministic manifests, preview artifacts, and isolated darktable runtime directories
- truthful preview compilation for a limited set of adjustment kinds
- an audited darktable module capability catalog that locks the editable backlog against the current `darktable/src/iop` inventory
- a fork-backed live bridge with lightweight session readback, generic control metadata, deep snapshot readback, and successful live exposure mutation
- a merged live module-instance action surface for `enable`, `disable`, `create`, `duplicate`, `delete`, `move-before`, and `move-after`

What does not exist yet:
- a broad darktable editing surface
- HTTP/API orchestration as the primary interface
- truthful support for every recipe adjustment already named in the contract
- full live parity for the audited module catalog
- fork-only editing features such as retouch or liquify in the CLI

## Core Features

- `capabilities` returns JSON describing the supported recipe adjustment surface and broader darktable-native capability map
- `smoke` runs a real fixture-backed `darktable-cli` export and records the result
- `render-preview` compiles supported recipes into XMP sidecars and renders a preview image through `darktable-cli`
- `live-session-info` returns lightweight live darkroom session state for bounded polling loops
- `live-session-snapshot` returns active-image, control, module-stack, and history readback through the sibling fork helper
- `live-set-exposure` performs a successful live mutation through the generic bridge control surface
- `live-module-instance-action` applies live lifecycle actions against snapshot `instanceKey` values and returns an authoritative post-mutation snapshot
- successful runs return JSON-only payloads with canonical artifact paths and execution diagnostics
- smoke and preview runs use separate runtime directories, so they can run concurrently without clobbering each other

## Supported Adjustment Surface

The current preview compiler supports these `DevelopRecipe` adjustment kinds:
- `crop`
- `exposure`
- `contrast`
- `saturation`
- `vibrance`
- `highlights`
- `shadows`
- `blackPoint`
- `whitePoint`
- `temperature` + `tint` as a required pair

The contract also includes `whites` and `blacks`, but preview compilation does not support them yet. Those requests fail explicitly instead of being mapped to a misleading darktable control.

## Stock darktable vs fork-required tooling

| Area | Works with stock packaged darktable | Requires `cgasgarth/darktable` or helper tooling from that fork |
| --- | --- | --- |
| `help` and `capabilities` | Yes | No |
| `smoke` against supported fixtures | Yes, with `darktable-cli` and `darktable` on `PATH` | No |
| `render-preview` for `crop`, `exposure`, `contrast`, `saturation`, `vibrance`, `highlights`, `shadows`, `blackPoint`, `whitePoint` | Yes | No |
| `render-preview` for `temperature` + `tint` | No | Yes - darktableAI resolves truthful temperature-module params through `darktable-wb-resolve`, expected at `../darktable/build/bin/darktable-wb-resolve` |
| `live-session-info`, `live-session-snapshot`, `live-set-exposure`, `live-module-instance-action` | No | Yes - these commands require `../darktable/build/bin/darktable-live-bridge` and a darktable GUI session |
| retouch / spot removal / liquify style controls | No | These are marked `fork-required` in capabilities, but they are not implemented in the CLI yet |

Notes:
- `blackPoint` and `whitePoint` are truthful `rgblevels` endpoint controls, not aliases for generic `blacks` or `whites`.
- The optional `legacy-sony-a7m5-fixture` may not decode on packaged darktable builds.

## Prerequisites

- Bun `>=1.3.6`
- `darktable-cli` and `darktable` installed and available on `PATH`
- for white balance preview recipes, a build of `cgasgarth/darktable` with `darktable-wb-resolve` at `../darktable/build/bin/darktable-wb-resolve`

## Installation and Setup

```bash
bun install
bun run cli -- help
bun run cli -- capabilities
```

If you want to run preview recipes that include `temperature` and `tint`, build the sibling darktable fork first so the helper binary exists where the compiler expects it.

## CLI Usage

Entry point:

```bash
bun run cli -- <command>
```

Common commands:

```bash
bun run cli -- help
bun run cli -- capabilities
bun run cli -- smoke --fixture sample-fixture
bun run cli -- render-preview --recipe-file examples/recipes/sample-develop-recipe.json
bun run cli -- live-session-info
bun run cli -- live-session-snapshot
bun run cli -- live-set-exposure --exposure 1.25 --timeout-ms 1500 --poll-interval-ms 100
bun run cli -- live-module-instance-action --instance-key exposure#0#0# --action duplicate
bun run cli -- live-module-instance-action --instance-key colorbalancergb#7#1#mask --action move-after --anchor-instance-key exposure#0#0#
```

Reusable validation commands:

```bash
bun run smoke:preview
bun run smoke:live
bun run smoke:live-snapshot
```

- `smoke:preview` is the 15-second darktable-cli fixture smoke check.
- `smoke:live` is the 15-second tmux/dbus/xvfb live-session validation that expects live exposure mutation to complete and read back through the sibling `darktable` fork helper.
- `smoke:live-snapshot` is the 15-second tmux/dbus/xvfb snapshot validation for `live-session-snapshot`; in this workspace it may still hit the known repo-built darktable startup instability documented in `docs/agent-feedback-loop.md`.
- There is not yet a package-level smoke alias that exercises every lifecycle action; the merged lifecycle slices are currently pinned by command tests, parser/use-case tests, and the fork helper validator.

Typical preview loop:
1. Write or update a recipe JSON file.
2. Run `bun run cli -- render-preview --recipe-file <path>`.
3. Read the JSON response from stdout.
4. Inspect `manifestPath`, `compiledArtifactPath`, `outputImagePath`, and `diagnostics`.
5. Revise the recipe and run again.

See `docs/cli.md` for command details and `docs/agent-feedback-loop.md` for the current iteration model.
See `docs/darktable-module-capability-catalog.md` for the audited module catalog that now drives the feature backlog.

## Recipe Model

`DevelopRecipe` currently contains:
- `recipeId`
- `sourceAssetPath`
- `adjustments`

Important validation rules:
- recipes must include at least one adjustment
- adjustment kinds cannot be duplicated
- crop bounds must be normalized and stay within `[0, 1]`
- `blackPoint` and `whitePoint` must stay normalized with `blackPoint < whitePoint`
- `temperature` and `tint` must appear together

A working sample recipe lives at `examples/recipes/sample-develop-recipe.json`.

## Development Workflow

```bash
bun run check
```

That command runs:
- `bun run lint`
- `bun run lint:max-lines`
- `bun run typecheck`
- `bun run test`

Integration coverage that exercises real darktable rendering is available separately:

```bash
bun run test:integration
```

Use that integration suite when you change darktable execution, fixture handling, recipe compilation, or artifact layout on a machine with darktable installed.

For fast manual validation during live-control work:

```bash
bun run smoke:preview
bun run smoke:live
bun run smoke:live-snapshot
```

For manual lifecycle validation against a healthy fork session:

```bash
bun run cli -- live-session-snapshot
bun run cli -- live-module-instance-action --instance-key <key> --action <enable|disable|create|duplicate|delete>
bun run cli -- live-module-instance-action --instance-key <key> --action <move-before|move-after> --anchor-instance-key <key>
```

The smoke commands are wrapped in hard 15-second timeouts so they fail fast instead of hanging the session. Use `live-session-snapshot` to discover `instanceKey` values before lifecycle actions and treat the returned `snapshot` as the post-mutation source of truth.

## Contributing

Contributions are welcome, but keep changes aligned with the audited module catalog and current feature-complete roadmap.

Expectations:
- keep the CLI and contracts explicit; do not add ambiguous defaults or silent fallbacks
- prefer truthful darktable mappings over approximate or invented behavior
- update docs when the command surface or supported adjustment set changes
- run `bun run check` before opening a PR
- open changes from a feature branch and target `main`

If you add or change darktable-facing behavior, include tests that cover the affected contract or compiler path.
