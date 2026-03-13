import { describe, expect, test } from "bun:test";

import { GetLiveDarktableSnapshot } from "./get-live-darktable-snapshot";

describe("GetLiveDarktableSnapshot", (): void => {
  test("returns the current live snapshot readback", async (): Promise<void> => {
    const useCase = new GetLiveDarktableSnapshot({
      getSession: () => {
        throw new Error("Unexpected call.");
      },
      getSnapshot: () =>
        Promise.resolve({
          bridgeVersion: 1,
          status: "unavailable" as const,
          reason: "unsupported-view" as const,
          diagnostics: {
            helperBinaryPath: "/helper",
            commandArguments: ["/helper", "get-snapshot"],
            exitCode: 0,
            elapsedMilliseconds: 4
          }
        }),
      setExposure: () => {
        throw new Error("Unexpected call.");
      },
      applyModuleInstanceBlend: () => {
        throw new Error("Unexpected call.");
      },
      applyModuleInstanceAction: () => {
        throw new Error("Unexpected call.");
      }
    });

    expect(await useCase.execute({})).toEqual({
      bridgeVersion: 1,
      status: "unavailable",
      reason: "unsupported-view",
      diagnostics: {
        helperBinaryPath: "/helper",
        commandArguments: ["/helper", "get-snapshot"],
        exitCode: 0,
        elapsedMilliseconds: 4
      }
    });
  });
});
