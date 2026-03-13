import { describe, expect, test } from "bun:test";

import type { LiveDarktableSnapshotState } from "../../application/models/live-darktable";
import type { LiveDarktableAvailableModuleMaskState } from "../../application/models/live-darktable-module-mask";
import { RunLiveModuleMaskActionCommand } from "./run-live-module-mask-action-command";

describe("RunLiveModuleMaskActionCommand", (): void => {
  test("wraps successful clear-mask responses", async (): Promise<void> => {
    const command = new RunLiveModuleMaskActionCommand({
      execute: () =>
        Promise.resolve({
          mutation: createSuccessMutation(),
          latestSnapshot: createSuccessMutation(),
          helperCallDiagnostics: [createDiagnostics()]
        })
    });

    const result = await command.execute({
      requestId: "request-1",
      instanceKey: "colorbalancergb#7#1#",
      action: "clear-mask"
    });

    expect(result).toEqual({
      ok: true,
      output: {
        requestId: "request-1",
        bridgeVersion: 1,
        status: "ok",
        diagnostics: [createDiagnostics()],
        session: createSession(),
        activeImage: createActiveImage(),
        snapshot: createSnapshot(),
        moduleMask: createSuccessMutation().moduleMask
      }
    });
  });

  test("forwards reuse-same-shapes source keys", async (): Promise<void> => {
    const requests: Array<Record<string, unknown>> = [];
    const command = new RunLiveModuleMaskActionCommand({
      execute: (request) => {
        requests.push({ ...request });
        return Promise.resolve({
          mutation: createSuccessMutation("reuse-same-shapes"),
          latestSnapshot: createSuccessMutation("reuse-same-shapes"),
          helperCallDiagnostics: [createDiagnostics()]
        });
      }
    });

    await command.execute({
      requestId: "request-2",
      instanceKey: "colorbalancergb#7#1#",
      action: "reuse-same-shapes",
      sourceInstanceKey: "exposure#0#0#"
    });

    expect(requests).toEqual([
      {
        instanceKey: "colorbalancergb#7#1#",
        action: "reuse-same-shapes",
        sourceInstanceKey: "exposure#0#0#"
      }
    ]);
  });
});

function createDiagnostics(): {
  readonly helperBinaryPath: "/helper";
  readonly commandArguments: readonly ["/helper", "apply-module-instance-mask"];
  readonly exitCode: 0;
  readonly elapsedMilliseconds: 5;
} {
  return {
    helperBinaryPath: "/helper",
    commandArguments: ["/helper", "apply-module-instance-mask"],
    exitCode: 0,
    elapsedMilliseconds: 5
  } as const;
}

function createSession(): {
  readonly view: "darkroom";
  readonly renderSequence: 12;
  readonly historyChangeSequence: 4;
  readonly imageLoadSequence: 1;
} {
  return {
    view: "darkroom",
    renderSequence: 12,
    historyChangeSequence: 4,
    imageLoadSequence: 1
  } as const;
}

function createActiveImage(): {
  readonly imageId: 7;
  readonly directoryPath: "/photos";
  readonly fileName: "frame.ARW";
  readonly sourceAssetPath: "/photos/frame.ARW";
} {
  return {
    imageId: 7,
    directoryPath: "/photos",
    fileName: "frame.ARW",
    sourceAssetPath: "/photos/frame.ARW"
  } as const;
}

function createSnapshot(): LiveDarktableSnapshotState {
  return {
    appliedHistoryEnd: 2,
    controls: [
      {
        id: "exposure.exposure",
        module: "exposure",
        control: "exposure",
        operations: ["get", "set"],
        requires: { view: "darkroom", activeImage: true },
        valueType: { type: "number", minimum: -3, maximum: 4 },
        value: 0.5
      }
    ],
    moduleStack: [
      {
        instanceKey: "exposure#0#0#",
        moduleOp: "exposure",
        enabled: true,
        iopOrder: 12,
        multiPriority: 0,
        multiName: "",
        params: { encoding: "unsupported" },
        blend: {
          supported: true,
          masksSupported: true,
          opacity: 100,
          blendMode: "normal",
          reverseOrder: false
        }
      },
      {
        instanceKey: "colorbalancergb#7#1#",
        moduleOp: "colorbalancergb",
        enabled: true,
        iopOrder: 18,
        multiPriority: 1,
        multiName: "mask",
        params: { encoding: "unsupported" },
        blend: {
          supported: true,
          masksSupported: true,
          opacity: 75,
          blendMode: "normal",
          reverseOrder: false
        }
      }
    ],
    historyItems: [
      {
        index: 0,
        applied: true,
        instanceKey: "exposure#0#0#",
        moduleOp: "exposure",
        enabled: true,
        iopOrder: 12,
        multiPriority: 0,
        multiName: "",
        params: { encoding: "unsupported" },
        blend: {
          supported: true,
          masksSupported: true,
          opacity: 100,
          blendMode: "normal",
          reverseOrder: false
        }
      },
      {
        index: 1,
        applied: true,
        instanceKey: "colorbalancergb#7#1#",
        moduleOp: "colorbalancergb",
        enabled: true,
        iopOrder: 18,
        multiPriority: 1,
        multiName: "mask",
        params: { encoding: "unsupported" },
        blend: {
          supported: true,
          masksSupported: true,
          opacity: 75,
          blendMode: "normal",
          reverseOrder: false
        }
      }
    ]
  } as const;
}

function createSuccessMutation(
  action: "clear-mask" | "reuse-same-shapes" = "clear-mask"
): LiveDarktableAvailableModuleMaskState {
  return {
    bridgeVersion: 1,
    status: "ok",
    diagnostics: createDiagnostics(),
    session: createSession(),
    activeImage: createActiveImage(),
    moduleMask: {
      targetInstanceKey: "colorbalancergb#7#1#",
      action,
      ...(action === "reuse-same-shapes" ? { sourceInstanceKey: "exposure#0#0#" } : {}),
      moduleOp: "colorbalancergb",
      iopOrder: 18,
      multiPriority: 1,
      multiName: "mask",
      previousHasMask: action === "clear-mask",
      currentHasMask: action !== "clear-mask",
      changed: true,
      previousForms: [{ formId: 11, state: 1, opacity: 1 }],
      sourceForms: action === "reuse-same-shapes" ? [{ formId: 22, state: 1, opacity: 1 }] : [],
      currentForms: action === "reuse-same-shapes" ? [{ formId: 22, state: 1, opacity: 1 }] : [],
      historyBefore: 3,
      historyAfter: 4,
      requestedHistoryEnd: 4
    },
    snapshot: createSnapshot()
  } as const;
}
