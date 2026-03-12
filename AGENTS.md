# darktableAI Agent Rules

## Stack and workflow

- Use Bun for package management, scripts, tests, and local execution.
- Use TypeScript for product code unless there is a clear reason not to.
- Work on feature branches and open PRs; do not push directly to `main`.

## Architecture expectations

- Prefer dependency injection over hidden global state.
- Put clear interfaces in front of all classes.
- Keep API contracts explicit and stable.
- Prefer small, composable modules over large service objects.

## API contract rules

- Avoid optional inputs when the caller should make an explicit choice.
- Avoid default values and fallback behavior when intent is ambiguous.
- Reject invalid API calls with explicit errors rather than guessing.
- Keep request and response schemas precise, versionable, and shared.

## Quality bar

- Keep human-authored files at 400 lines or fewer when practical; split files before they become hard to review.
- Run `bun run check` before commit if the hook has not already done so.
- Validate changes against the standing RAW fixture workflow when relevant.
