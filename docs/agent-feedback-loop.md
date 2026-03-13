# Agent Feedback Loop

If the editing surface is CLI-first, then yes: we need an explicit feedback loop.

## Recommended MVP loop

1. Write or update a `DevelopRecipe` JSON file.
2. Run `bun run cli -- render-preview --recipe-file <path>`.
3. Parse stdout JSON and capture `manifestPath`, `outputImagePath`, `sourceAssetPath`, `compiledArtifactPath`, and `diagnostics.runtimeState`.
4. Inspect the manifest plus returned artifacts directly from those paths.
5. Rewrite the recipe JSON and run again.
6. Periodically run `bun run cli -- smoke --fixture sample-fixture` to verify the darktable worker path is still healthy.
7. Treat `diagnostics.commandArguments` and `diagnostics.runtimeState` as the canonical debug trail for each successful run.

Example preview response:

```json
{
  "requestId": "6d5bd55b-0e96-4d5e-b61b-c2c6a46e6af8",
  "status": "ok",
  "manifestId": "preview-manifest-123",
  "manifestPath": "/repo/artifacts/manifests/preview-manifest-123.json",
  "outputImagePath": "/repo/artifacts/preview/preview-manifest-123-preview.jpg",
  "sourceAssetPath": "/repo/_DSC8809.ARW",
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
- a stable CLI surface for smoke testing
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

## What still needs to be implemented

- preview support for additional adjustment kinds beyond the current crop, tone, color, white-balance, and `rgblevels` endpoint surface
- a truthful generic `whites` / `blacks` mapping if darktable later exposes one that is not just a proxy for `rgblevels`
- richer output inspection so the agent can score results instead of only checking process success
- a stronger iteration loop on top of the current supported preview adjustment surface

## Recommended operator checks

- Run `bun run cli -- help` to confirm the available commands.
- Run `bun run cli -- capabilities` before recipe generation when the agent needs the live supported/planned adjustment set.
- Pair `temperature` with `tint` in the same recipe whenever white balance is requested.
- Use `blackPoint` and `whitePoint` when you need truthful endpoint control; do not substitute unsupported generic `whites` or `blacks`.
- Use `bun run cli -- render-preview --recipe-file <path>` only with currently supported adjustments unless explicit failure handling is part of the workflow.

## API or CLI?

For AI agents like OpenCode or Codex, the primary interface should be the CLI.

Why:
- easier tool use from coding agents
- no server lifecycle needed during early development
- explicit files, manifests, and exit codes make iteration easier
- simpler to self-validate against fixture images during implementation

An API can still make sense later for a web UI or long-running multi-user orchestration, but it should sit on top of the same command/use-case layer rather than replace it.
