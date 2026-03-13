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

Runtime note:
- `help`, `capabilities`, `smoke`, and preview renders that stay within `crop`, `exposure`, `contrast`, `saturation`, `vibrance`, `highlights`, `shadows`, `blackPoint`, and `whitePoint` work with stock packaged darktable
- preview renders that include `temperature` and `tint` also require the `darktable-wb-resolve` helper from `cgasgarth/darktable`, expected at `../darktable/build/bin/darktable-wb-resolve`

## Commands

### `help`

Show command usage.

```bash
bun run cli -- help
```

Current commands: `help`, `capabilities`, `smoke`, `render-preview`, `live-session-info`, `live-session-snapshot`, `live-set-exposure`, `live-module-instance-action`.

Reusable package-level smoke aliases:

```bash
bun run smoke:preview
bun run smoke:live
bun run smoke:live-snapshot
```

- `smoke:preview` wraps the fixture-backed `smoke` CLI path with a hard 15-second timeout.
- `smoke:live` runs the end-to-end live darktable validation flow under a hard 15-second timeout and expects the requested exposure mutation to complete.
- `smoke:live-snapshot` runs the live snapshot readback validation under a hard 15-second timeout against the sibling fork build; local reruns can still expose the known repo-built darktable startup instability.
- There is not yet a package-level smoke alias that exercises every lifecycle action; use `live-session-snapshot`, `live-module-instance-action`, and the fork helper validator for bounded lifecycle verification.

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

Planning note:
- `bun run cli -- capabilities` is the user-facing support summary.
- `src/contracts/darktable-module-capability-catalog.ts` plus `docs/darktable-module-capability-catalog.md` are the audited planning source of truth for the full module backlog.

Operator notes:
- `temperature` and `tint` are truthful darktable temperature-module controls, but recipes must provide both together
- `temperature` + `tint` preview compilation depends on the fork helper `darktable-wb-resolve`; stock packaged darktable alone is not enough for that path
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

### `live-session-info`

Reads the current live darktable GUI session through the sibling `darktable-live-bridge` helper.

```bash
bun run cli -- live-session-info
```

Success returns JSON-only stdout with:
- `requestId`
- `bridgeVersion`
- `status`
- `session.{view,renderSequence,historyChangeSequence,imageLoadSequence}`
- `activeImage.{imageId,directoryPath,fileName,sourceAssetPath}` when available
- `exposure.current` when available
- `diagnostics.{helperBinaryPath,commandArguments,exitCode,elapsedMilliseconds}`

Normal unavailable states such as no active darkroom image stay machine-readable on stdout with `status: "unavailable"`.

Use this command for lightweight polling loops. It stays intentionally smaller than `live-session-snapshot`.

### `live-session-snapshot`

Reads the current live darkroom snapshot through the sibling `darktable-live-bridge` helper.

```bash
bun run cli -- live-session-snapshot
```

Success returns JSON-only stdout with:
- `requestId`
- `bridgeVersion`
- `status`
- `session.{view,renderSequence,historyChangeSequence,imageLoadSequence}`
- `activeImage.{imageId,directoryPath,fileName,sourceAssetPath}`
- `snapshot.appliedHistoryEnd`
- `snapshot.controls[]` with current generic live-control metadata and values
- `snapshot.moduleStack[]` with enabled-instance state and parameter encoding data
- `snapshot.historyItems[]` with applied-history ordering and parameter encoding data
- `diagnostics.{helperBinaryPath,commandArguments,exitCode,elapsedMilliseconds}`

Current bridge/readback notes:
- the generic live-control registry currently exposes `exposure.exposure`
- snapshot controls are an array, not a module-keyed map
- `moduleStack` is a truthful darkroom stack snapshot and must include the exposure module in the current validator contract
- parameter blobs are encoded either as `introspection-v1` fields or `unsupported` when darktable does not expose a truthful typed walk
- expected unavailable states still stay machine-readable on stdout with `status: "unavailable"`

### `live-set-exposure`

Applies an exposure change to the image currently shown in darkroom through the live bridge.

```bash
bun run cli -- live-set-exposure --exposure 1.25
bun run cli -- live-set-exposure --exposure 1.25 --timeout-ms 1500 --poll-interval-ms 100
```

Behavior:
- `--exposure` is an absolute EV target.
- if both wait flags are provided, the command polls until the requested render sequence is observed or the wait times out.
- the mutation is the exposure-specific CLI on top of the generic live control id `exposure.exposure`
- helper transport failures stay non-zero/stderr; expected unavailable states stay JSON/stdout.

Success returns JSON-only stdout with:
- `requestId`
- `bridgeVersion`
- `status`
- `setExposure.{previous,requested,current,requestedRenderSequence}`
- `wait.{mode,targetRenderSequence,latestObservedRenderSequence,pollCount,completed,timedOut,...}` when wait mode is used
- `session`, `activeImage`, `exposure`
- `diagnostics` for every helper call made during the command

### `live-module-instance-action`

Applies a live module-instance lifecycle action against a snapshot-discovered `instanceKey`.

Unary actions:

```bash
bun run cli -- live-module-instance-action --instance-key exposure#0#0# --action enable
bun run cli -- live-module-instance-action --instance-key exposure#0#0# --action disable
bun run cli -- live-module-instance-action --instance-key exposure#0#0# --action create
bun run cli -- live-module-instance-action --instance-key exposure#0#0# --action duplicate
bun run cli -- live-module-instance-action --instance-key colorbalancergb#7#1#mask --action delete
```

Reorder actions:

```bash
bun run cli -- live-module-instance-action --instance-key colorbalancergb#7#1#mask --action move-before --anchor-instance-key exposure#0#0#
bun run cli -- live-module-instance-action --instance-key colorbalancergb#7#1#mask --action move-after --anchor-instance-key exposure#0#0#
```

Behavior:
- `--instance-key` must come from `live-session-snapshot` `snapshot.moduleStack[].instanceKey`.
- `--action` accepts `enable`, `disable`, `create`, `duplicate`, `delete`, `move-before`, and `move-after`.
- `--anchor-instance-key` is required only for reorder actions and rejected for every other action.
- lifecycle actions are darkroom-only and require an active image in the current GUI session.
- the helper-returned `snapshot` is the authoritative post-mutation readback; the command does not perform a second snapshot fetch.
- expected unavailable states stay machine-readable on stdout with `status: "unavailable"`; helper transport failures stay non-zero/stderr.

Success returns JSON-only stdout with:
- `requestId`
- `bridgeVersion`
- `status`
- `session.{view,renderSequence,historyChangeSequence,imageLoadSequence}`
- `activeImage.{imageId,directoryPath,fileName,sourceAssetPath}`
- `snapshot.appliedHistoryEnd`
- `snapshot.controls[]`, `snapshot.moduleStack[]`, and `snapshot.historyItems[]`
- `moduleAction` describing the requested lifecycle mutation
- `diagnostics[]` for every helper call made during the command

`moduleAction` fields depend on the action:
- toggle actions include `requestedEnabled`, `previousEnabled`, `currentEnabled`, and `changed`
- create and duplicate actions include `resultInstanceKey`
- delete actions include the deleted target descriptors and may include replacement identity fields when base-instance promotion happens
- reorder actions include `anchorInstanceKey`, `previousIopOrder`, and `currentIopOrder`

Current expected unavailable reasons include:
- `unsupported-view`
- `no-active-image`
- `unknown-instance-key`
- `unknown-anchor-instance-key`
- `unsupported-module-action`
- `unsupported-module-state`
- `module-delete-blocked-last-instance`
- `module-reorder-no-op`
- `module-reorder-blocked-by-fence`
- `module-reorder-blocked-by-rule`
- `module-action-failed`
- `snapshot-unavailable`

Operational notes:
- use `live-session-snapshot` immediately before lifecycle actions so `instanceKey` values come from the current visible stack
- treat the returned `snapshot` as the source of truth for post-action order, enabled state, family membership, and base-instance promotion
- `smoke:live` validates exposure mutation only and `smoke:live-snapshot` validates snapshot readback only; there is not yet a package-level smoke alias that runs every lifecycle action
- local reruns of snapshot-driven lifecycle validation may still be blocked by the known repo-built sibling `darktable` startup/import crash documented in `docs/agent-feedback-loop.md`
