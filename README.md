# darktableAI

Main product repo for the AI-assisted photo editing system built around darktable as the rendering engine.

## Current direction

- Use darktable as the deterministic photo-processing worker.
- Build the product control plane here.
- Keep darktable-specific fork changes in `../darktable`.
- Use Bun and strict TypeScript for the main product code.
- Work on branches and merge through PRs rather than pushing directly to `main`.
- Make the CLI the primary AI-facing entry point during MVP work.

## Recommended stack

- TypeScript for the API server, worker orchestration, CLI, schemas, and validation tooling.
- Optional Python only for narrow ML or image-analysis experiments that benefit from the Python ecosystem.

## Working rules

- Prefer dependency injection and explicit interfaces around class-based code.
- Keep API contracts strict: avoid ambiguous optional inputs, defaults, and fallbacks.
- Run `bun run check` before merge; the local hooks do this automatically on commit.

## CLI entry point

- Canonical entry point: `bun run cli -- <command>`
- Current commands are documented in `docs/cli.md`
- Agent iteration loop is documented in `docs/agent-feedback-loop.md`

Useful commands:

```bash
bun run cli -- help
bun run cli -- capabilities
bun run cli -- smoke --fixture sample-fixture
bun run cli -- render-preview --recipe-file examples/recipes/sample-develop-recipe.json
```

Canonical agent loop:

1. Write or update a recipe JSON file.
2. Run `bun run cli -- render-preview --recipe-file <path>`.
3. Parse the JSON success payload from stdout.
4. Inspect the returned `manifestPath`, `outputImagePath`, `sourceAssetPath`, and `compiledArtifactPath`.
5. Revise the recipe and rerun.

Example preview success payload:

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

Current status:

- `help` lists the current CLI surface: `help`, `capabilities`, `smoke`, `render-preview`.
- `capabilities` prints JSON-only capability data with both recipe-level `adjustments` support and broader `darktableNative` coverage.
- `smoke` performs a real `darktable-cli` run and returns deterministic manifest and artifact paths.
- `render-preview` compiles supported develop recipes into generated darktable XMP sidecars and renders them with `darktable-cli`.
- `smoke` and `render-preview` use isolated darktable runtime directories, so concurrent smoke + preview runs succeed without clobbering each other.
- Supported preview adjustments: `crop`, `exposure`, `contrast`, `saturation`, `vibrance`, `highlights`, `shadows`, paired `temperature` + `tint`, and truthful `blackPoint` / `whitePoint` endpoint control via `rgblevels`.
- `temperature` and `tint` must be present together in the same recipe so darktableAI can resolve truthful darktable temperature-module params from image metadata.
- Preview remains unsupported for generic `whites` and `blacks`; unsupported kinds fail explicitly instead of silently mapping them to `rgblevels`.
- Successful `smoke` and `render-preview` responses stay JSON-only and include diagnostics with runtime paths plus the exact darktable command arguments used for the run.

## Near-term goals

1. Define the canonical `DevelopRecipe` schema.
2. Expand preview coverage beyond the current crop, tone, and color adjustment set.
3. Add richer automated feedback artifacts on top of the CLI loop.
4. Add reproducible validation manifests for every run.
