import { describe, expect, test } from "bun:test";

import { GetLiveDarktableSession } from "./get-live-darktable-session";

describe("GetLiveDarktableSession", (): void => {
  test("returns the current live session snapshot", async (): Promise<void> => {
    const useCase = new GetLiveDarktableSession({
      getSession: () =>
        Promise.resolve({
          bridgeVersion: 1,
          status: "unavailable" as const,
          reason: "unsupported-view" as const,
          diagnostics: {
            helperBinaryPath: "/helper",
            commandArguments: ["/helper", "get-session"],
            exitCode: 0,
            elapsedMilliseconds: 4
          }
        }),
      setExposure: () => {
        throw new Error("Unexpected call.");
      }
    });

    expect(await useCase.execute({})).toEqual({
      bridgeVersion: 1,
      status: "unavailable",
      reason: "unsupported-view",
      diagnostics: {
        helperBinaryPath: "/helper",
        commandArguments: ["/helper", "get-session"],
        exitCode: 0,
        elapsedMilliseconds: 4
      }
    });
  });
});
