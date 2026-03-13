import path from "node:path";

import type { CliInvocation } from "./cli-invocation";

export interface CliInvocationParser {
  parse(argv: ReadonlyArray<string>): CliInvocation;
}

export class StrictCliInvocationParser implements CliInvocationParser {
  public parse(argv: ReadonlyArray<string>): CliInvocation {
    if (argv.length === 0) {
      return { kind: "help" };
    }

    const [command, ...rest] = argv;

    if (command === undefined || this.isHelpFlag(command)) {
      return { kind: "help" };
    }

    if (command === "smoke") {
      return this.parseSmoke(rest);
    }

    if (command === "render-preview") {
      return this.parseRenderPreview(rest);
    }

    if (command === "capabilities") {
      return this.parseCapabilities(rest);
    }

    throw new Error(`Unknown command '${command}'. Run 'bun run cli -- help' for usage.`);
  }

  private parseSmoke(argv: ReadonlyArray<string>): CliInvocation {
    const fixtureId = this.readRequiredOption(argv, "--fixture");

    return {
      kind: "smoke",
      fixtureId
    };
  }

  private parseRenderPreview(argv: ReadonlyArray<string>): CliInvocation {
    const recipeFilePath = this.readRequiredOption(argv, "--recipe-file");

    return {
      kind: "render-preview",
      recipeFilePath: path.resolve(process.cwd(), recipeFilePath)
    };
  }

  private parseCapabilities(argv: ReadonlyArray<string>): CliInvocation {
    this.assertNoPositionalArgs(argv, "capabilities");

    return {
      kind: "capabilities"
    };
  }

  private readRequiredOption(argv: ReadonlyArray<string>, optionName: string): string {
    const optionIndex = argv.indexOf(optionName);

    if (optionIndex === -1) {
      throw new Error(`Missing required option '${optionName}'.`);
    }

    const optionValue = argv[optionIndex + 1];

    if (optionValue === undefined || optionValue.startsWith("--")) {
      throw new Error(`Option '${optionName}' requires a value.`);
    }

    return optionValue;
  }

  private isHelpFlag(value: string): boolean {
    return value === "help" || value === "--help" || value === "-h";
  }

  private assertNoPositionalArgs(argv: ReadonlyArray<string>, commandName: string): void {
    if (argv.length > 0) {
      throw new Error(`Command '${commandName}' does not accept additional arguments.`);
    }
  }
}
