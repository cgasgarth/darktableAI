# darktable module capability catalog

`src/contracts/darktable-module-capability-catalog.ts` is the source of truth for the darktable module backlog in this repo.

Use it when a PR needs to answer any of these questions:

- Which audited `darktable/src/iop/*.c` modules are already covered, partially covered, planned, fork-required, legacy, or intentionally excluded?
- Which current recipe adjustments or darktable-native capability ids map to a given module?
- Whether a module has preview support, live support, or only backlog status.
- Whether a source file is helper/internal/non-user-editable and therefore excluded on purpose.

Semantics:

- `implemented`: darktableAI already covers the intended editable surface for this slice.
- `partial`: darktableAI supports some truthful parameters for the module, but more module parameters remain backlogged.
- `planned`: the module is a valid future parity target, but no truthful implementation ships yet.
- `fork-required`: the module needs deeper darktable integration than the current sidecar/live architecture can provide.
- `legacy`: darktable keeps the module for compatibility, but darktable itself flags it deprecated and it is not a modern parity target.
- `excluded`: the file is helper/internal/diagnostic/non-editing, or otherwise intentionally out of scope for the editable backlog.

Support and backlog fields:

- `previewSupport` tracks truthful preview compiler support only.
- `liveSupport` tracks truthful live-session mutation support only.
- `parameterBacklogStatus` is `complete`, `partial`, `queued`, `blocked`, or `not-applicable`.

Workflow for future PRs:

1. Update `src/contracts/darktable-module-capability-catalog.ts` first.
2. If darktable adds or removes `src/iop/*.c` files in the audited snapshot, update `src/contracts/darktable-iop-audited-inventory.ts` in the same PR.
3. Keep `src/contracts/adjustment-capability.ts` and `src/contracts/darktable-native-capability.ts` aligned with the cataloged module ids.
4. If a local sibling `../darktable` checkout is present, run `timeout 15s bun run scripts/validate-darktable-iop-audited-inventory.ts` before sending the PR.

The checked-in tests intentionally validate against the audited inventory instead of a sibling checkout so CI stays hermetic.
