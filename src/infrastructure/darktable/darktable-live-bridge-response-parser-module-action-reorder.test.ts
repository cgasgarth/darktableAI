import { describe, expect, test } from "bun:test";

import { DarktableLiveBridgeResponseParser } from "./darktable-live-bridge-response-parser";

const diagnostics = {
  helperBinaryPath: "/opt/darktable/build/bin/darktable-live-bridge",
  commandArguments: ["/opt/darktable/build/bin/darktable-live-bridge", "apply-module-instance-action"],
  exitCode: 0,
  elapsedMilliseconds: 12
} as const;

describe("DarktableLiveBridgeResponseParser reorder module actions", (): void => {
  test.each(["move-before", "move-after"] as const)("parses %s payloads", (action): void => {
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
          targetInstanceKey: "colorbalancergb#0#1#mask",
          action,
          anchorInstanceKey: "exposure#0#0#",
          moduleOp: "colorbalancergb",
          iopOrder: 8,
          multiPriority: 1,
          multiName: "mask",
          previousIopOrder: 14,
          currentIopOrder: 8,
          historyBefore: 4,
          historyAfter: 5,
          requestedHistoryEnd: 5
        },
        snapshot: createSnapshot()
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
      snapshot: createSnapshot(),
      moduleAction: {
        targetInstanceKey: "colorbalancergb#0#1#mask",
        action,
        anchorInstanceKey: "exposure#0#0#",
        moduleOp: "colorbalancergb",
        iopOrder: 8,
        multiPriority: 1,
        multiName: "mask",
        previousIopOrder: 14,
        currentIopOrder: 8,
        historyBefore: 4,
        historyAfter: 5,
        requestedHistoryEnd: 5
      }
    });
  });

  test.each([
    "unknown-anchor-instance-key",
    "module-reorder-blocked-by-fence",
    "module-reorder-blocked-by-rule",
    "module-reorder-no-op"
  ] as const)("parses unavailable reason '%s'", (reason): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(
      parser.parseApplyModuleInstanceAction(
        JSON.stringify({
          bridgeVersion: 1,
          status: "unavailable",
          reason,
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
            targetInstanceKey: "colorbalancergb#0#1#mask",
            action: "move-after",
            anchorInstanceKey: "exposure#0#0#",
            previousIopOrder: 14,
            currentIopOrder: 14
          }
        }),
        diagnostics
      )
    ).toEqual({
      bridgeVersion: 1,
      status: "unavailable",
      reason,
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
        targetInstanceKey: "colorbalancergb#0#1#mask",
        action: "move-after",
        anchorInstanceKey: "exposure#0#0#",
        previousIopOrder: 14,
        currentIopOrder: 14
      },
      diagnostics
    });
  });
});

function createSnapshot(): {
  readonly appliedHistoryEnd: 1;
  readonly controls: readonly [
    {
      readonly id: "exposure.exposure";
      readonly module: "exposure";
      readonly control: "exposure";
      readonly operations: readonly ["get", "set"];
      readonly requires: {
        readonly activeImage: true;
        readonly view: "darkroom";
      };
      readonly valueType: {
        readonly type: "number";
        readonly minimum: -3;
        readonly maximum: 4;
      };
      readonly value: 0.25;
    }
  ];
  readonly moduleStack: readonly [
    {
      readonly instanceKey: "exposure#0#0#";
      readonly moduleOp: "exposure";
      readonly enabled: true;
      readonly iopOrder: 12;
      readonly multiPriority: 0;
      readonly multiName: "0";
      readonly params: {
        readonly encoding: "unsupported";
      };
    },
    {
      readonly instanceKey: "colorbalancergb#0#1#mask";
      readonly moduleOp: "colorbalancergb";
      readonly enabled: true;
      readonly iopOrder: 8;
      readonly multiPriority: 1;
      readonly multiName: "mask";
      readonly params: {
        readonly encoding: "unsupported";
      };
    }
  ];
  readonly historyItems: readonly [
    {
      readonly index: 0;
      readonly applied: true;
      readonly instanceKey: "colorbalancergb#0#1#mask";
      readonly moduleOp: "colorbalancergb";
      readonly enabled: true;
      readonly iopOrder: 8;
      readonly multiPriority: 1;
      readonly multiName: "mask";
      readonly params: {
        readonly encoding: "unsupported";
      };
    }
  ];
} {
  return {
    appliedHistoryEnd: 1,
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
        params: {
          encoding: "unsupported"
        }
      },
      {
        instanceKey: "colorbalancergb#0#1#mask",
        moduleOp: "colorbalancergb",
        enabled: true,
        iopOrder: 8,
        multiPriority: 1,
        multiName: "mask",
        params: {
          encoding: "unsupported"
        }
      }
    ],
    historyItems: [
      {
        index: 0,
        applied: true,
        instanceKey: "colorbalancergb#0#1#mask",
        moduleOp: "colorbalancergb",
        enabled: true,
        iopOrder: 8,
        multiPriority: 1,
        multiName: "mask",
        params: {
          encoding: "unsupported"
        }
      }
    ]
  } as const;
}
