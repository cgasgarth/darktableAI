export interface DarktableBinaryBinding {
  readonly name: "darktable-cli" | "darktable";
  readonly path: string;
}

export type DarktableBinaryLocatorResult =
  | {
      readonly status: "available";
      readonly darktableCli: DarktableBinaryBinding;
      readonly darktable: DarktableBinaryBinding;
    }
  | {
      readonly status: "missing";
      readonly missing: ReadonlyArray<"darktable-cli" | "darktable">;
      readonly darktableCli?: DarktableBinaryBinding;
      readonly darktable?: DarktableBinaryBinding;
    };

export class EnvironmentDarktableBinaryLocator {
  public locate(): Promise<DarktableBinaryLocatorResult> {
    const darktableCli = Bun.which("darktable-cli");
    const darktable = Bun.which("darktable");

    const missing: Array<"darktable-cli" | "darktable"> = [];
    const cliBinding: DarktableBinaryBinding | null =
      darktableCli === null ? null : { name: "darktable-cli", path: darktableCli };
    const guiBinding: DarktableBinaryBinding | null =
      darktable === null ? null : { name: "darktable", path: darktable };

    if (cliBinding === null) {
      missing.push("darktable-cli");
    }

    if (guiBinding === null) {
      missing.push("darktable");
    }

    if (missing.length > 0) {
      return Promise.resolve({
        status: "missing",
        missing,
        ...(cliBinding === null ? {} : { darktableCli: cliBinding }),
        ...(guiBinding === null ? {} : { darktable: guiBinding })
      });
    }

    if (cliBinding === null || guiBinding === null) {
      throw new Error("Unable to resolve both darktable binaries despite no missing entries.");
    }

    return Promise.resolve({
      status: "available",
      darktableCli: cliBinding,
      darktable: guiBinding
    });
  }
}
