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

    if (command === "live-session-info") {
      return this.parseLiveSessionInfo(rest);
    }

    if (command === "live-session-snapshot") {
      return this.parseLiveSessionSnapshot(rest);
    }

    if (command === "live-set-exposure") {
      return this.parseLiveSetExposure(rest);
    }

    if (command === "live-set-module-blend") {
      return this.parseLiveSetModuleBlend(rest);
    }

    if (command === "live-module-instance-action") {
      return this.parseLiveModuleInstanceAction(rest);
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

  private parseLiveSessionInfo(argv: ReadonlyArray<string>): CliInvocation {
    this.assertNoPositionalArgs(argv, "live-session-info");

    return {
      kind: "live-session-info"
    };
  }

  private parseLiveSessionSnapshot(argv: ReadonlyArray<string>): CliInvocation {
    this.assertNoPositionalArgs(argv, "live-session-snapshot");

    return {
      kind: "live-session-snapshot"
    };
  }

  private parseLiveSetExposure(argv: ReadonlyArray<string>): CliInvocation {
    const exposure = this.readNumberOption(argv, "--exposure");
    const timeoutMilliseconds = this.readOptionalIntegerOption(argv, "--timeout-ms");
    const pollIntervalMilliseconds = this.readOptionalIntegerOption(argv, "--poll-interval-ms");

    if (timeoutMilliseconds === undefined && pollIntervalMilliseconds === undefined) {
      return {
        kind: "live-set-exposure",
        exposure,
        wait: {
          mode: "none"
        }
      };
    }

    if (timeoutMilliseconds === undefined || pollIntervalMilliseconds === undefined) {
      throw new Error(
        "Command 'live-set-exposure' requires both '--timeout-ms' and '--poll-interval-ms' when waiting for render completion."
      );
    }

    return {
      kind: "live-set-exposure",
      exposure,
      wait: {
        mode: "until-render",
        timeoutMilliseconds,
        pollIntervalMilliseconds
      }
    };
  }

  private parseLiveSetModuleBlend(argv: ReadonlyArray<string>): CliInvocation {
    const instanceKey = this.readRequiredOption(argv, "--instance-key");
    const opacity = this.readNumberOption(argv, "--opacity");

    return {
      kind: "live-set-module-blend",
      instanceKey,
      opacity
    };
  }

  private parseLiveModuleInstanceAction(argv: ReadonlyArray<string>): CliInvocation {
    const instanceKey = this.readRequiredOption(argv, "--instance-key");
    const action = this.readRequiredOption(argv, "--action");
    const anchorInstanceKey = this.readOptionalOption(argv, "--anchor-instance-key");

    if (action === "move-before" || action === "move-after") {
      if (anchorInstanceKey === undefined) {
        throw new Error("Missing required option '--anchor-instance-key'.");
      }

      return {
        kind: "live-module-instance-action",
        instanceKey,
        action,
        anchorInstanceKey
      };
    }

    if (
      action !== "enable" &&
      action !== "disable" &&
      action !== "create" &&
      action !== "duplicate" &&
      action !== "delete"
    ) {
      throw new Error(
        "Option '--action' must be 'enable', 'disable', 'create', 'duplicate', 'delete', 'move-before', or 'move-after'."
      );
    }

    if (anchorInstanceKey !== undefined) {
      throw new Error(
        "Option '--anchor-instance-key' is only supported with '--action move-before' or '--action move-after'."
      );
    }

    return {
      kind: "live-module-instance-action",
      instanceKey,
      action
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

  private readOptionalOption(argv: ReadonlyArray<string>, optionName: string): string | undefined {
    const optionIndex = argv.indexOf(optionName);

    if (optionIndex === -1) {
      return undefined;
    }

    const optionValue = argv[optionIndex + 1];

    if (optionValue === undefined || optionValue.startsWith("--")) {
      throw new Error(`Option '${optionName}' requires a value.`);
    }

    return optionValue;
  }

  private readNumberOption(argv: ReadonlyArray<string>, optionName: string): number {
    const optionValue = this.readRequiredOption(argv, optionName);
    return this.parseFiniteNumber(optionValue, optionName);
  }

  private readOptionalIntegerOption(
    argv: ReadonlyArray<string>,
    optionName: string
  ): number | undefined {
    const optionValue = this.readOptionalOption(argv, optionName);

    if (optionValue === undefined) {
      return undefined;
    }

    const parsed = this.parseFiniteNumber(optionValue, optionName);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error(`Option '${optionName}' must be a positive integer.`);
    }

    return parsed;
  }

  private parseFiniteNumber(optionValue: string, optionName: string): number {
    const parsed = Number(optionValue);

    if (!Number.isFinite(parsed)) {
      throw new Error(`Option '${optionName}' must be a finite number.`);
    }

    return parsed;
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
