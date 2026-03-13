import { describe, expect, test } from "bun:test";

import { RunLiveSessionInfoCommand } from "./run-live-session-info-command";

describe("RunLiveSessionInfoCommand", (): void => {
  test("returns live session data as machine-readable JSON payload", async (): Promise<void> => {
    const command = new RunLiveSessionInfoCommand({
      execute: () =>
        Promise.resolve({
          bridgeVersion: 1,
          status: "ok" as const,
          session: {
            view: "darkroom",
            renderSequence: 33,
            historyChangeSequence: 12,
            imageLoadSequence: 4
          },
          exposure: {
            current: -0.25
          },
          diagnostics: {
            helperBinaryPath: "/helper",
            commandArguments: ["/helper", "get-session"],
            exitCode: 0,
            elapsedMilliseconds: 11
          }
        })
    });

    const result = await command.execute({ requestId: "request-1" });

    expect(result).toEqual({
      ok: true,
      output: {
        requestId: "request-1",
        bridgeVersion: 1,
        status: "ok",
        session: {
          view: "darkroom",
          renderSequence: 33,
          historyChangeSequence: 12,
          imageLoadSequence: 4
        },
        exposure: {
          current: -0.25
        },
        diagnostics: {
          helperBinaryPath: "/helper",
          commandArguments: ["/helper", "get-session"],
          exitCode: 0,
          elapsedMilliseconds: 11
        }
      }
    });
  });
});
