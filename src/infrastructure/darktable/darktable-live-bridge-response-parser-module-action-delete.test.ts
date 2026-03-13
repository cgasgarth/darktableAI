import { describe, expect, test } from "bun:test";

import { DarktableLiveBridgeResponseParser } from "./darktable-live-bridge-response-parser";

const diagnostics = {
  helperBinaryPath: "/opt/darktable/build/bin/darktable-live-bridge",
  commandArguments: ["/opt/darktable/build/bin/darktable-live-bridge", "apply-module-instance-action"],
  exitCode: 0,
  elapsedMilliseconds: 12
} as const;

describe("DarktableLiveBridgeResponseParser delete module actions", (): void => {
  test("parses delete payloads with replacement identity", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();
    const result = parser.parseApplyModuleInstanceAction(
      JSON.stringify({
        bridgeVersion: 1,
        status: "ok",
        session: {
          view: "darkroom",
          renderSequence: 15,
          historyChangeSequence: 10,
          imageLoadSequence: 3
        },
        activeImage: {
          imageId: 42,
          directoryPath: "/photos/session",
          fileName: "frame.ARW",
          sourceAssetPath: "/photos/session/frame.ARW"
        },
        moduleAction: {
          targetInstanceKey: "colorbalancergb#7#1#mask",
          action: "delete",
          moduleOp: "colorbalancergb",
          iopOrder: 8,
          multiPriority: 1,
          multiName: "mask",
          historyBefore: 6,
          historyAfter: 5,
          requestedHistoryEnd: 5,
          replacementInstanceKey: "colorbalancergb#8#2#replacement",
          replacementIopOrder: 9,
          replacementMultiPriority: 2,
          replacementMultiName: "replacement"
        },
        snapshot: {
          appliedHistoryEnd: 1,
          controls: [
            {
              id: "exposure.exposure",
              module: "exposure",
              control: "exposure",
              operations: ["get", "set"],
              requires: { activeImage: true, view: "darkroom" },
              valueType: { type: "number", minimum: -3, maximum: 4 },
              value: 0.25
            }
          ],
          moduleStack: [
            {
              instanceKey: "exposure#0#0#",
              moduleOp: "exposure",
              enabled: true,
              iopOrder: 12,
              multiPriority: 0,
              multiName: "0",
              params: { encoding: "unsupported" }
            },
            {
              instanceKey: "colorbalancergb#8#2#replacement",
              moduleOp: "colorbalancergb",
              enabled: true,
              iopOrder: 9,
              multiPriority: 2,
              multiName: "replacement",
              params: { encoding: "unsupported" }
            }
          ],
          historyItems: [
            {
              index: 0,
              applied: true,
              instanceKey: "colorbalancergb#8#2#replacement",
              moduleOp: "colorbalancergb",
              enabled: true,
              iopOrder: 9,
              multiPriority: 2,
              multiName: "replacement",
              params: { encoding: "unsupported" }
            }
          ]
        }
      }),
      diagnostics
    );

    expect(result).toEqual({
      bridgeVersion: 1,
      status: "ok",
      diagnostics,
      session: {
        view: "darkroom",
        renderSequence: 15,
        historyChangeSequence: 10,
        imageLoadSequence: 3
      },
      activeImage: {
        imageId: 42,
        directoryPath: "/photos/session",
        fileName: "frame.ARW",
        sourceAssetPath: "/photos/session/frame.ARW"
      },
      moduleAction: {
        targetInstanceKey: "colorbalancergb#7#1#mask",
        action: "delete",
        moduleOp: "colorbalancergb",
        iopOrder: 8,
        multiPriority: 1,
        multiName: "mask",
        historyBefore: 6,
        historyAfter: 5,
        requestedHistoryEnd: 5,
        replacementInstanceKey: "colorbalancergb#8#2#replacement",
        replacementIopOrder: 9,
        replacementMultiPriority: 2,
        replacementMultiName: "replacement"
      },
      snapshot: {
        appliedHistoryEnd: 1,
        controls: [
          {
            id: "exposure.exposure",
            module: "exposure",
            control: "exposure",
            operations: ["get", "set"],
            requires: { activeImage: true, view: "darkroom" },
            valueType: { type: "number", minimum: -3, maximum: 4 },
            value: 0.25
          }
        ],
        moduleStack: [
          {
            instanceKey: "exposure#0#0#",
            moduleOp: "exposure",
            enabled: true,
            iopOrder: 12,
            multiPriority: 0,
            multiName: "0",
            params: { encoding: "unsupported" }
          },
          {
            instanceKey: "colorbalancergb#8#2#replacement",
            moduleOp: "colorbalancergb",
            enabled: true,
            iopOrder: 9,
            multiPriority: 2,
            multiName: "replacement",
            params: { encoding: "unsupported" }
          }
        ],
        historyItems: [
          {
            index: 0,
            applied: true,
            instanceKey: "colorbalancergb#8#2#replacement",
            moduleOp: "colorbalancergb",
            enabled: true,
            iopOrder: 9,
            multiPriority: 2,
            multiName: "replacement",
            params: { encoding: "unsupported" }
          }
        ]
      }
    });
  });

  test("parses unavailable delete payloads", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(
      parser.parseApplyModuleInstanceAction(
        JSON.stringify({
          bridgeVersion: 1,
          status: "unavailable",
          reason: "module-delete-blocked-last-instance",
          session: {
            view: "darkroom",
            renderSequence: 15,
            historyChangeSequence: 10,
            imageLoadSequence: 3
          },
          activeImage: {
            imageId: 42,
            directoryPath: "/photos/session",
            fileName: "frame.ARW",
            sourceAssetPath: "/photos/session/frame.ARW"
          },
          moduleAction: {
            targetInstanceKey: "colorbalancergb#7#1#mask",
            action: "delete",
            moduleOp: "colorbalancergb",
            iopOrder: 8,
            multiPriority: 1,
            multiName: "mask",
            historyBefore: 6,
            historyAfter: 6,
            requestedHistoryEnd: 6
          }
        }),
        diagnostics
      )
    ).toEqual({
      bridgeVersion: 1,
      status: "unavailable",
      reason: "module-delete-blocked-last-instance",
      diagnostics,
      session: {
        view: "darkroom",
        renderSequence: 15,
        historyChangeSequence: 10,
        imageLoadSequence: 3
      },
      activeImage: {
        imageId: 42,
        directoryPath: "/photos/session",
        fileName: "frame.ARW",
        sourceAssetPath: "/photos/session/frame.ARW"
      },
      moduleAction: {
        targetInstanceKey: "colorbalancergb#7#1#mask",
        action: "delete",
        moduleOp: "colorbalancergb",
        iopOrder: 8,
        multiPriority: 1,
        multiName: "mask",
        historyBefore: 6,
        historyAfter: 6,
        requestedHistoryEnd: 6
      }
    });
  });
});
