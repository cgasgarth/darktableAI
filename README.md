# darktableAI

Main product repo for the AI-assisted photo editing system built around darktable as the rendering engine.

## Current direction

- Use darktable as the deterministic photo-processing worker.
- Build the product control plane here.
- Keep darktable-specific fork changes in `../darktable`.
- Use Bun and strict TypeScript for the main product code.
- Work on branches and merge through PRs rather than pushing directly to `main`.

## Recommended stack

- TypeScript for the API server, worker orchestration, CLI, schemas, and validation tooling.
- Optional Python only for narrow ML or image-analysis experiments that benefit from the Python ecosystem.

## Working rules

- Prefer dependency injection and explicit interfaces around class-based code.
- Keep API contracts strict: avoid ambiguous optional inputs, defaults, and fallbacks.
- Run `bun run check` before merge; the local hooks do this automatically on commit.

## Near-term goals

1. Define the canonical `EditPlan` schema.
2. Build a small CLI and worker runner around the sample RAW fixture.
3. Add reproducible validation manifests for every run.
