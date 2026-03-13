#!/usr/bin/env bun

import { createApplicationServices } from "../composition/create-application-services";
import {
  JsonDevelopRecipeDocumentLoader
} from "../interfaces/cli/develop-recipe-document-loader";
import {
  StrictCliInvocationParser
} from "../interfaces/cli/cli-invocation-parser";
import {
  type CliCommandResult
} from "../interfaces/cli/cli-command";
import type { CliInvocation } from "../interfaces/cli/cli-invocation";

const parser = new StrictCliInvocationParser();
const recipeLoader = new JsonDevelopRecipeDocumentLoader();
const services = createApplicationServices();

const invocation = parseInvocation(Bun.argv.slice(2));

await run();

function parseInvocation(argv: ReadonlyArray<string>): CliInvocation {
  try {
    return parser.parse(argv);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Unknown CLI invocation error.");
    exitProcess(1);
  }
}

async function run(): Promise<never> {
  switch (invocation.kind) {
    case "help":
      console.log(getHelpText());
      return exitProcess(0);
    case "smoke": {
      const result = await services.runDarktableSmokeCommand.execute({
        requestId: crypto.randomUUID(),
        fixtureId: invocation.fixtureId
      });

      return handleCommandResult(result);
    }
    case "render-preview": {
      const recipe = await recipeLoader.loadFromFile(invocation.recipeFilePath);
      const result = await services.createPreviewRenderCommand.execute({
        requestId: crypto.randomUUID(),
        recipe
      });

      return handleCommandResult(result);
    }
    case "capabilities": {
      const result = await services.runAdjustmentCapabilitiesCommand.execute({});

      return handleCommandResult(result);
    }
  }
}

function handleCommandResult(
  result: CliCommandResult<unknown>
): never {
  if (!result.ok) {
    console.error(result.error);
    return exitProcess(1);
  }

  console.log(JSON.stringify(result.output));
  return exitProcess(0);
}

function exitProcess(code: number): never {
  process.exit(code);
  throw new Error(`Process exit returned unexpectedly with code ${String(code)}.`);
}

function getHelpText(): string {
  return [
    "darktableAI CLI",
    "",
    "Commands:",
    "  bun run cli -- help",
    "  bun run cli -- capabilities",
    "  bun run cli -- smoke --fixture <fixture-id>",
    "  bun run cli -- render-preview --recipe-file <path>",
    "",
    "Examples:",
    "  bun run cli -- capabilities",
    "  bun run cli -- smoke --fixture sample-fixture",
    "  bun run cli -- render-preview --recipe-file examples/recipes/sample-develop-recipe.json",
    "",
    "Success responses print JSON on stdout. Failures print human-readable errors on stderr."
  ].join("\n");
}
