# Agent Feedback Loop

If the editing surface is CLI-first, then yes: we need an explicit feedback loop.

## Recommended Loop

1. Write or update a `DevelopRecipe` JSON file.
2. Run `bun run cli -- render-preview --recipe-file <path>`.
3. Parse stdout JSON and capture `manifestPath`, `outputImagePath`, `sourceAssetPath`, `compiledArtifactPath`, and `diagnostics.runtimeState`.
4. Inspect the manifest plus returned artifacts directly from those paths.
5. Rewrite the recipe JSON and run again.
6. Periodically run `bun run smoke:preview` to verify the darktable worker path is still healthy.
7. Treat `diagnostics.commandArguments` and `diagnostics.runtimeState` as the canonical debug trail for each successful run.

For live GUI control work, also run these bounded checks:
- `bun run smoke:live` for successful exposure mutation and lightweight session readback
- `bun run smoke:live-snapshot` for deep snapshot readback of controls, module stack, and history items

Both scripts use the sibling `darktable-live-bridge` helper, a tmux-hosted darktable session, and hard 15-second timeouts so validation fails fast instead of hanging.

Example preview response:

```json
{
  "requestId": "6d5bd55b-0e96-4d5e-b61b-c2c6a46e6af8",
  "status": "ok",
  "manifestId": "preview-manifest-123",
  "manifestPath": "/repo/artifacts/manifests/preview-manifest-123.json",
  "outputImagePath": "/repo/artifacts/preview/preview-manifest-123-preview.jpg",
  "sourceAssetPath": "/repo/assets/_DSC8809.ARW",
  "compiledArtifactPath": "/repo/artifacts/preview/recipes/compile-123.xmp",
  "diagnostics": {
    "binaryPath": "/usr/bin/darktable-cli",
    "commandArguments": ["/usr/bin/darktable-cli", "..."],
    "runtimeState": {
      "rootDirectory": "/repo/artifacts/runtime/preview-manifest-123",
      "configDirectory": "/repo/artifacts/runtime/preview-manifest-123/config",
      "cacheDirectory": "/repo/artifacts/runtime/preview-manifest-123/cache",
      "temporaryDirectory": "/repo/artifacts/runtime/preview-manifest-123/tmp",
      "libraryPath": "/repo/artifacts/runtime/preview-manifest-123/library.db"
    },
    "exitCode": 0
  }
}
```

The loop stays deterministic because the CLI returns the actual saved manifest and artifact paths. Agents do not need extra directory scanning or naming guesses.

The loop also supports concurrent `smoke` and `render-preview` runs because each command uses its own isolated darktable runtime directory.

## What already exists

- a `capabilities` command that returns JSON-only recipe-level `adjustments` support plus broader `darktableNative` coverage
- an audited module catalog in `src/contracts/darktable-module-capability-catalog.ts` that locks the full editable backlog against the current darktable module inventory
- a stable CLI surface for smoke testing
- reusable smoke aliases `smoke:preview`, `smoke:live`, and `smoke:live-snapshot`
- a single canonical CLI entry point
- manifest writing for runs
- deterministic artifact directories under `artifacts/`
- render/smoke success payloads that include direct manifest and artifact paths
- a strict `DevelopRecipe` contract for adjustment requests
- real preview execution through `darktable-cli`
- isolated darktable runtime directories for smoke/preview concurrency
- current preview support for `crop`, `exposure`, `contrast`, `saturation`, `vibrance`, `highlights`, `shadows`, paired `temperature` + `tint`, and truthful `blackPoint` / `whitePoint` endpoint control via `rgblevels`
- explicit current non-support for generic `whites` and `blacks`
- JSON-only success payloads that include diagnostics with runtime paths and exact darktable command arguments
- stock packaged darktable coverage for smoke plus preview recipes that stay off the white-balance helper path
- a fork-helper requirement for preview recipes that include paired `temperature` + `tint`, because those runs resolve params through `darktable-wb-resolve`
- a live-control path through `live-session-info`, `live-session-snapshot`, and `live-set-exposure`, backed by the sibling `darktable-live-bridge` helper from the fork
- a generic live bridge control surface under the fork helper, currently exposing `exposure.exposure` for list/get/set operations while keeping the older exposure-specific command for compatibility
- truthful live snapshot readback for active image, module stack, control values, and history items

## What still needs to be implemented

- preview support for additional adjustment kinds beyond the current crop, tone, color, white-balance, and `rgblevels` endpoint surface
- a truthful generic `whites` / `blacks` mapping if darktable later exposes one that is not just a proxy for `rgblevels`
- generic live mutation/readback expansion beyond exposure so the audited module catalog can move from partial to full parity
- module lifecycle, blend, mask, style, and history workflows on top of the current live bridge foundation
- richer output inspection so the agent can score results instead of only checking process success

## Recommended operator checks

- Run `bun run cli -- help` to confirm the available commands.
- Run `bun run cli -- capabilities` before recipe generation when the agent needs the live supported/planned adjustment set, then consult `docs/darktable-module-capability-catalog.md` for the audited per-module backlog.
- Run `bun run smoke:preview` for the offline preview/worker path, `bun run smoke:live` for live mutation, and `bun run smoke:live-snapshot` for deep readback.
- Pair `temperature` with `tint` in the same recipe whenever white balance is requested.
- Use a sibling build of `cgasgarth/darktable` when the recipe includes `temperature` + `tint`; stock packaged darktable is enough for the other currently supported preview adjustments.
- Use `blackPoint` and `whitePoint` when you need truthful endpoint control; do not substitute unsupported generic `whites` or `blacks`.
- Use `bun run cli -- render-preview --recipe-file <path>` only with currently supported adjustments unless explicit failure handling is part of the workflow.

## Current Caveat

The merged snapshot readback path is documented and tested at the contract level, but the repo-built sibling `../darktable/build/bin/darktable` still shows a local startup/import instability in this workspace.

That can make `bun run smoke:live-snapshot` and the fork helper validator fail locally even though the code and PR slices are merged. Keep that caveat explicit in validation notes until the runtime issue is fixed.

## API or CLI?

For AI agents like OpenCode or Codex, the primary interface should be the CLI.

Why:
- easier tool use from coding agents
- no server lifecycle needed during early development
- explicit files, manifests, and exit codes make iteration easier
- simpler to self-validate against fixture images during implementation

An API can still make sense later for a web UI or long-running multi-user orchestration, but it should sit on top of the same command/use-case layer rather than replace it.
