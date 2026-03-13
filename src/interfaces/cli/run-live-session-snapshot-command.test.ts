import { describe, expect, test } from "bun:test";

import { RunLiveSessionSnapshotCommand } from "./run-live-session-snapshot-command";

describe("RunLiveSessionSnapshotCommand", (): void => {
  test("returns live snapshot readback as machine-readable JSON payload", async (): Promise<void> => {
    const command = new RunLiveSessionSnapshotCommand({
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
          activeImage: {
            imageId: 7,
            directoryPath: "/photos",
            fileName: "frame.ARW",
            sourceAssetPath: "/photos/frame.ARW"
          },
          snapshot: {
            appliedHistoryEnd: 5,
            controls: [
              {
                id: "exposure.exposure",
                module: "exposure",
                control: "exposure",
                operations: ["get", "set"],
                requires: {
                  activeImage: true,
                  view: "darkroom"
                },
                valueType: {
                  type: "number",
                  minimum: -3,
                  maximum: 4
                },
                value: -0.25
              }
            ],
            moduleStack: [],
            historyItems: []
          },
          diagnostics: {
            helperBinaryPath: "/helper",
            commandArguments: ["/helper", "get-snapshot"],
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
        activeImage: {
          imageId: 7,
          directoryPath: "/photos",
          fileName: "frame.ARW",
          sourceAssetPath: "/photos/frame.ARW"
        },
        snapshot: {
          appliedHistoryEnd: 5,
          controls: [
            {
              id: "exposure.exposure",
              module: "exposure",
              control: "exposure",
              operations: ["get", "set"],
              requires: {
                activeImage: true,
                view: "darkroom"
              },
              valueType: {
                type: "number",
                minimum: -3,
                maximum: 4
              },
              value: -0.25
            }
          ],
          moduleStack: [],
          historyItems: []
        },
        diagnostics: {
          helperBinaryPath: "/helper",
          commandArguments: ["/helper", "get-snapshot"],
          exitCode: 0,
          elapsedMilliseconds: 11
        }
      }
    });
  });

  test("preserves unavailable session context", async (): Promise<void> => {
    const command = new RunLiveSessionSnapshotCommand({
      execute: () =>
        Promise.resolve({
          bridgeVersion: 1,
          status: "unavailable" as const,
          reason: "unsupported-view" as const,
          session: {
            view: "lighttable",
            renderSequence: 8,
            historyChangeSequence: 4,
            imageLoadSequence: 1
          },
          diagnostics: {
            helperBinaryPath: "/helper",
            commandArguments: ["/helper", "get-snapshot"],
            exitCode: 0,
            elapsedMilliseconds: 11
          }
        })
    });

    const result = await command.execute({ requestId: "request-2" });

    expect(result).toEqual({
      ok: true,
      output: {
        requestId: "request-2",
        bridgeVersion: 1,
        status: "unavailable",
        reason: "unsupported-view",
        session: {
          view: "lighttable",
          renderSequence: 8,
          historyChangeSequence: 4,
          imageLoadSequence: 1
        },
        diagnostics: {
          helperBinaryPath: "/helper",
          commandArguments: ["/helper", "get-snapshot"],
          exitCode: 0,
          elapsedMilliseconds: 11
        }
      }
    });
  });
});
