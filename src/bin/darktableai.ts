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
    case "live-session-info": {
      const result = await services.runLiveSessionInfoCommand.execute({
        requestId: crypto.randomUUID()
      });

      return handleCommandResult(result);
    }
    case "live-session-snapshot": {
      const result = await services.runLiveSessionSnapshotCommand.execute({
        requestId: crypto.randomUUID()
      });

      return handleCommandResult(result);
    }
    case "live-set-exposure": {
      const result = await services.runLiveSetExposureCommand.execute(
        invocation.wait.mode === "none"
          ? {
              requestId: crypto.randomUUID(),
              exposure: invocation.exposure,
              wait: invocation.wait
            }
          : {
              requestId: crypto.randomUUID(),
              exposure: invocation.exposure,
              wait: invocation.wait
            }
      );

      return handleCommandResult(result);
    }
    case "live-module-instance-action": {
      const result = await services.runLiveModuleInstanceActionCommand.execute({
        requestId: crypto.randomUUID(),
        instanceKey: invocation.instanceKey,
        action: invocation.action
      });

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
    "  bun run cli -- live-session-info",
    "  bun run cli -- live-session-snapshot",
    "  bun run cli -- live-set-exposure --exposure <ev>",
    "  bun run cli -- live-set-exposure --exposure <ev> --timeout-ms <ms> --poll-interval-ms <ms>",
    "  bun run cli -- live-module-instance-action --instance-key <key> --action <enable|disable>",
    "",
    "Examples:",
    "  bun run cli -- capabilities",
    "  bun run cli -- smoke --fixture sample-fixture",
    "  bun run cli -- render-preview --recipe-file examples/recipes/sample-develop-recipe.json",
    "  bun run cli -- live-session-info",
    "  bun run cli -- live-session-snapshot",
    "  bun run cli -- live-set-exposure --exposure 0.5 --timeout-ms 1500 --poll-interval-ms 100",
    "  bun run cli -- live-module-instance-action --instance-key exposure#0#0# --action disable",
    "",
    "Success responses print JSON on stdout. Failures print human-readable errors on stderr."
  ].join("\n");
}
