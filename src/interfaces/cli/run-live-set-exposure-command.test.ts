import { describe, expect, test } from "bun:test";

import { RunLiveSetExposureCommand } from "./run-live-set-exposure-command";

describe("RunLiveSetExposureCommand", (): void => {
  test("returns structured unavailable responses with exit-0 semantics", async (): Promise<void> => {
    const command = new RunLiveSetExposureCommand({
      execute: () =>
        Promise.resolve({
          mutation: {
            bridgeVersion: 1,
            status: "unavailable" as const,
            reason: "no-active-image" as const,
            diagnostics: {
              helperBinaryPath: "/helper",
              commandArguments: ["/helper", "set-exposure", "0.25"],
              exitCode: 0,
              elapsedMilliseconds: 8
            }
          },
          latestSession: {
            bridgeVersion: 1,
            status: "unavailable" as const,
            reason: "no-active-image" as const,
            diagnostics: {
              helperBinaryPath: "/helper",
              commandArguments: ["/helper", "set-exposure", "0.25"],
              exitCode: 0,
              elapsedMilliseconds: 8
            }
          },
          helperCallDiagnostics: [
            {
              helperBinaryPath: "/helper",
              commandArguments: ["/helper", "set-exposure", "0.25"],
              exitCode: 0,
              elapsedMilliseconds: 8
            }
          ],
          wait: {
            mode: "none" as const,
            pollCount: 0,
            completed: true,
            timedOut: false
          }
        })
    });

    const result = await command.execute({
      requestId: "request-2",
      exposure: 0.25,
      wait: {
        mode: "none"
      }
    });

    expect(result).toEqual({
      ok: true,
      output: {
        requestId: "request-2",
        bridgeVersion: 1,
        status: "unavailable",
        reason: "no-active-image",
        diagnostics: [
          {
            helperBinaryPath: "/helper",
            commandArguments: ["/helper", "set-exposure", "0.25"],
            exitCode: 0,
            elapsedMilliseconds: 8
          }
        ],
        wait: {
          mode: "none",
          pollCount: 0,
          completed: true,
          timedOut: false
        }
      }
    });
  });
});
