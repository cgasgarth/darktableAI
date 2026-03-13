import { describe, expect, test } from "bun:test";

import { RunLiveModuleInstanceActionCommand } from "./run-live-module-instance-action-command";

describe("RunLiveModuleInstanceActionCommand unavailable reorder", (): void => {
  test("preserves unavailable reorder module-action context from the helper", async (): Promise<void> => {
    const command = new RunLiveModuleInstanceActionCommand({
      execute: () =>
        Promise.resolve({
          mutation: {
            bridgeVersion: 1,
            status: "unavailable" as const,
            reason: "unknown-anchor-instance-key" as const,
            session: {
              view: "darkroom",
              renderSequence: 8,
              historyChangeSequence: 3,
              imageLoadSequence: 1
            },
            activeImage: {
              imageId: 7,
              directoryPath: "/photos",
              fileName: "frame.ARW",
              sourceAssetPath: "/photos/frame.ARW"
            },
            moduleAction: {
              targetInstanceKey: "colorbalancergb#0#1#mask",
              action: "move-after",
              anchorInstanceKey: "missing#-1#-1#anchor",
              previousIopOrder: 14,
              currentIopOrder: 14,
              historyBefore: 5,
              historyAfter: 5,
              requestedHistoryEnd: 5
            },
            diagnostics: {
              helperBinaryPath: "/helper",
              commandArguments: [
                "/helper",
                "apply-module-instance-action",
                "colorbalancergb#0#1#mask",
                "move-after",
                "missing#-1#-1#anchor"
              ],
              exitCode: 0,
              elapsedMilliseconds: 7
            }
          },
          latestSnapshot: {
            bridgeVersion: 1,
            status: "unavailable" as const,
            reason: "unknown-anchor-instance-key" as const,
            session: {
              view: "darkroom",
              renderSequence: 8,
              historyChangeSequence: 3,
              imageLoadSequence: 1
            },
            activeImage: {
              imageId: 7,
              directoryPath: "/photos",
              fileName: "frame.ARW",
              sourceAssetPath: "/photos/frame.ARW"
            },
            moduleAction: {
              targetInstanceKey: "colorbalancergb#0#1#mask",
              action: "move-after",
              anchorInstanceKey: "missing#-1#-1#anchor",
              previousIopOrder: 14,
              currentIopOrder: 14,
              historyBefore: 5,
              historyAfter: 5,
              requestedHistoryEnd: 5
            },
            diagnostics: {
              helperBinaryPath: "/helper",
              commandArguments: [
                "/helper",
                "apply-module-instance-action",
                "colorbalancergb#0#1#mask",
                "move-after",
                "missing#-1#-1#anchor"
              ],
              exitCode: 0,
              elapsedMilliseconds: 7
            }
          },
          helperCallDiagnostics: [
            {
              helperBinaryPath: "/helper",
              commandArguments: [
                "/helper",
                "apply-module-instance-action",
                "colorbalancergb#0#1#mask",
                "move-after",
                "missing#-1#-1#anchor"
              ],
              exitCode: 0,
              elapsedMilliseconds: 7
            }
          ]
        })
    });

    const result = await command.execute({
      requestId: "request-reorder-unavailable",
      instanceKey: "colorbalancergb#0#1#mask",
      action: "move-after",
      anchorInstanceKey: "missing#-1#-1#anchor"
    });

    expect(result).toEqual({
      ok: true,
      output: {
        requestId: "request-reorder-unavailable",
        bridgeVersion: 1,
        status: "unavailable",
        reason: "unknown-anchor-instance-key",
        diagnostics: [
          {
            helperBinaryPath: "/helper",
            commandArguments: [
              "/helper",
              "apply-module-instance-action",
              "colorbalancergb#0#1#mask",
              "move-after",
              "missing#-1#-1#anchor"
            ],
            exitCode: 0,
            elapsedMilliseconds: 7
          }
        ],
        session: {
          view: "darkroom",
          renderSequence: 8,
          historyChangeSequence: 3,
          imageLoadSequence: 1
        },
        activeImage: {
          imageId: 7,
          directoryPath: "/photos",
          fileName: "frame.ARW",
          sourceAssetPath: "/photos/frame.ARW"
        },
        moduleAction: {
          targetInstanceKey: "colorbalancergb#0#1#mask",
          action: "move-after",
          anchorInstanceKey: "missing#-1#-1#anchor",
          previousIopOrder: 14,
          currentIopOrder: 14,
          historyBefore: 5,
          historyAfter: 5,
          requestedHistoryEnd: 5
        }
      }
    });
  });
});
