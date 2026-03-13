# CLI Reference

The canonical AI entry point is the CLI, not an HTTP API.

## Entry point

Use `bun run cli -- <command>` from the `darktableAI` repository root.

The CLI is designed for agent use:
- explicit arguments
- JSON success output on stdout
- human-readable errors on stderr
- non-zero exit codes on failure
- success payload diagnostics include runtime paths and the exact command arguments used

Returned success payload paths are canonical. Agents should use them directly instead of reconstructing artifact locations.

## Commands

### `help`

Show command usage.

```bash
bun run cli -- help
```

Current commands: `help`, `capabilities`, `smoke`, `render-preview`.

### `capabilities`

Prints JSON-only capability data for the current preview compiler support surface and broader darktable-native coverage.

```bash
bun run cli -- capabilities
```

The payload currently reports:
- top-level `adjustments` support for the recipe contract and top-level `darktableNative` coverage for darktable controls beyond the current recipe surface
- supported preview adjustments: `crop`, `exposure`, `contrast`, `saturation`, `vibrance`, `highlights`, `shadows`, paired `temperature` + `tint`, `blackPoint`, `whitePoint`
- planned or unsupported for the current sidecar compiler: `whites`, `blacks`
- per-adjustment metadata including `status`, `darktableModule`, and `reason`
- per-darktable-control metadata including `status`, `previewCompilationStatus`, `recipeAdjustmentKinds`, and `reason`

Operator notes:
- `temperature` and `tint` are truthful darktable temperature-module controls, but recipes must provide both together
- `blackPoint` and `whitePoint` map to linked-channel `rgblevels` endpoints; they are not aliases for generic `blacks` or `whites`

### `smoke`

Runs a real `darktable-cli` smoke export against a named RAW fixture.

Each smoke run gets its own isolated darktable runtime directory, so it can run safely alongside `render-preview`.

```bash
bun run cli -- smoke --fixture sample-fixture
```

Current fixture IDs:
- `sample-fixture` -> `assets/_DSC8809.ARW`
- `legacy-sony-a7m5-fixture` -> `../DSC00075.ARW`

On success, the command prints JSON including:
- `requestId`
- `status`
- `fixtureId`
- `manifestId`
- `manifestPath`
- `outputImagePath`
- `sourceAssetPath`
- `diagnostics.binaryPath`
- `diagnostics.commandArguments`
- `diagnostics.runtimeState.{rootDirectory,configDirectory,cacheDirectory,temporaryDirectory,libraryPath}`
- `diagnostics.exitCode`

Example success payload:

```json
{
  "requestId": "b0f5f8cf-6dd3-48b2-93b3-642d419f0a0f",
  "status": "ok",
  "fixtureId": "sample-fixture",
  "manifestId": "smoke-manifest-123",
  "manifestPath": "/repo/artifacts/manifests/smoke-manifest-123.json",
  "outputImagePath": "/repo/artifacts/smoke/smoke-manifest-123-smoke.jpg",
  "sourceAssetPath": "/repo/assets/_DSC8809.ARW",
  "diagnostics": {
    "binaryPath": "/usr/bin/darktable-cli",
    "commandArguments": ["/usr/bin/darktable-cli", "..."],
    "runtimeState": {
      "rootDirectory": "/repo/artifacts/runtime/smoke-manifest-123",
      "configDirectory": "/repo/artifacts/runtime/smoke-manifest-123/config",
      "cacheDirectory": "/repo/artifacts/runtime/smoke-manifest-123/cache",
      "temporaryDirectory": "/repo/artifacts/runtime/smoke-manifest-123/tmp",
      "libraryPath": "/repo/artifacts/runtime/smoke-manifest-123/library.db"
    },
    "exitCode": 0
  }
}
```

### `render-preview`

Loads a `DevelopRecipe` JSON file and attempts a preview render.

```bash
bun run cli -- render-preview --recipe-file examples/recipes/sample-develop-recipe.json
```

Recipe file notes:
- `sourceAssetPath` may be absolute or relative to the recipe file location
- the recipe schema maps to `DevelopRecipe` in `src/contracts/develop-recipe.ts`

Current status:
- the command contract is wired end-to-end
- each preview run gets its own isolated darktable runtime directory, so concurrent preview/smoke execution is supported
- supported adjustments compile to generated XMP sidecars and render through `darktable-cli`
- currently supported preview adjustments: `crop`, `exposure`, `contrast`, `saturation`, `vibrance`, `highlights`, `shadows`, paired `temperature` + `tint`, `blackPoint`, `whitePoint`
- currently unsupported preview adjustments: `whites`, `blacks`
- `temperature` and `tint` fail validation unless both are present in the same recipe
- `blackPoint` and `whitePoint` are truthful endpoint controls via `rgblevels`, while generic `whites` and `blacks` stay unsupported
- unsupported adjustment kinds fail explicitly instead of falling back to fake success

On success, the command prints JSON including:
- `requestId`
- `status`
- `manifestId`
- `manifestPath`
- `outputImagePath`
- `sourceAssetPath`
- `compiledArtifactPath`
- `diagnostics.binaryPath`
- `diagnostics.commandArguments`
- `diagnostics.runtimeState.{rootDirectory,configDirectory,cacheDirectory,temporaryDirectory,libraryPath}`
- `diagnostics.exitCode`

Example success payload:

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
    "commandArguments": [
      "/usr/bin/darktable-cli",
      "/repo/assets/_DSC8809.ARW",
      "/repo/artifacts/preview/recipes/compile-123.xmp",
      "/repo/artifacts/preview/preview-manifest-123-preview.jpg",
      "--core",
      "--configdir",
      "/repo/artifacts/runtime/preview-manifest-123/config",
      "--cachedir",
      "/repo/artifacts/runtime/preview-manifest-123/cache",
      "--library",
      "/repo/artifacts/runtime/preview-manifest-123/library.db",
      "--tmpdir",
      "/repo/artifacts/runtime/preview-manifest-123/tmp"
    ],
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

Canonical agent loop:
1. Write recipe JSON.
2. Keep `temperature` and `tint` paired when using white balance adjustments; do not send generic `whites` or `blacks`.
3. Run `bun run cli -- render-preview --recipe-file <path>`.
4. Parse stdout JSON.
5. Inspect `manifestPath`, `compiledArtifactPath`, `outputImagePath`, and `diagnostics`.
6. Update the recipe and rerun.
