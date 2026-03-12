import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const MAX_LINES = 400;
const ROOT_DIRECTORY = process.cwd();
const DIRECTORY_NAMES_TO_SKIP = new Set<string>([
  ".git",
  ".github",
  ".idea",
  ".vscode",
  "coverage",
  "dist",
  "node_modules"
]);
const FILE_NAMES_TO_SKIP = new Set<string>([
  "bun.lock",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock"
]);
const HUMAN_FILE_EXTENSIONS = new Set<string>([
  ".cjs",
  ".cts",
  ".json",
  ".js",
  ".md",
  ".mjs",
  ".mts",
  ".sh",
  ".toml",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml"
]);

const violations: Array<string> = [];

await visitDirectory(ROOT_DIRECTORY);

if (violations.length > 0) {
  console.error(`Found files over ${String(MAX_LINES)} lines:`);
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log(`All human-authored files are within ${String(MAX_LINES)} lines.`);

async function visitDirectory(directoryPath: string): Promise<void> {
  const directoryEntries = await readdir(directoryPath, { withFileTypes: true });

  for (const directoryEntry of directoryEntries) {
    const absolutePath = path.join(directoryPath, directoryEntry.name);

    if (directoryEntry.isDirectory()) {
      if (DIRECTORY_NAMES_TO_SKIP.has(directoryEntry.name)) {
        continue;
      }

      await visitDirectory(absolutePath);
      continue;
    }

    if (!directoryEntry.isFile()) {
      continue;
    }

    if (FILE_NAMES_TO_SKIP.has(directoryEntry.name)) {
      continue;
    }

    const extensionName = path.extname(directoryEntry.name);
    if (!HUMAN_FILE_EXTENSIONS.has(extensionName)) {
      continue;
    }

    const fileContents = await readFile(absolutePath, "utf8");
    const lineCount = fileContents.split(/\r?\n/u).length;

    if (lineCount > MAX_LINES) {
      const relativePath = path.relative(ROOT_DIRECTORY, absolutePath);
      violations.push(`${relativePath} (${String(lineCount)} lines)`);
    }
  }
}
