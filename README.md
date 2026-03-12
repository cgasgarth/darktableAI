# darktableAI

Main product repo for the AI-assisted photo editing system built around darktable as the rendering engine.

## Current direction

- Use darktable as the deterministic photo-processing worker.
- Build the product control plane here.
- Keep darktable-specific fork changes in `../darktable`.

## Recommended stack

- TypeScript for the API server, worker orchestration, CLI, schemas, and validation tooling.
- Optional Python only for narrow ML or image-analysis experiments that benefit from the Python ecosystem.

## Near-term goals

1. Define the canonical `EditPlan` schema.
2. Build a small CLI and worker runner around the sample RAW fixture.
3. Add reproducible validation manifests for every run.
