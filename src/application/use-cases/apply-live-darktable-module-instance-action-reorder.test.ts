import { describe, expect, test } from "bun:test";

import type {
  LiveDarktableModuleInstanceActionMutation,
  LiveDarktableSnapshotReadback,
  LiveDarktableSessionSnapshot
} from "../models/live-darktable";
import { ApplyLiveDarktableModuleInstanceAction } from "./apply-live-darktable-module-instance-action";

describe("ApplyLiveDarktableModuleInstanceAction reorder", (): void => {
  test("passes anchor instance keys through without extra snapshot fetches", async (): Promise<void> => {
    const mutation = {
      bridgeVersion: 1 as const,
      status: "ok" as const,
      session: createSession(),
      activeImage: createActiveImage(),
      moduleAction: {
        targetInstanceKey: "colorbalancergb#0#1#mask",
        action: "move-before" as const,
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
      snapshot: {
        appliedHistoryEnd: 5,
        controls: [],
        moduleStack: [],
        historyItems: []
      },
      diagnostics: createDiagnostics()
    };
    const gateway = new StubGateway(mutation);
    const useCase = new ApplyLiveDarktableModuleInstanceAction(gateway);

    const result = await useCase.execute({
      instanceKey: "colorbalancergb#0#1#mask",
      action: "move-before",
      anchorInstanceKey: "exposure#0#0#"
    });

    expect(gateway.requests).toEqual([
      {
        instanceKey: "colorbalancergb#0#1#mask",
        action: "move-before",
        anchorInstanceKey: "exposure#0#0#"
      }
    ]);
    expect(gateway.getSnapshotCalls).toBe(0);
    expect(result.latestSnapshot).toBe(mutation);
  });
});

class StubGateway {
  public readonly requests: Array<{
    readonly instanceKey: string;
    readonly action: "move-before";
    readonly anchorInstanceKey: string;
  }> = [];
  public getSnapshotCalls = 0;

  public constructor(private readonly mutation: LiveDarktableModuleInstanceActionMutation) {}

  public getSession(): Promise<LiveDarktableSessionSnapshot> {
    throw new Error("Unexpected getSession call.");
  }

  public getSnapshot(): Promise<LiveDarktableSnapshotReadback> {
    this.getSnapshotCalls += 1;
    throw new Error("Unexpected getSnapshot call.");
  }

  public setExposure(): Promise<never> {
    throw new Error("Unexpected setExposure call.");
  }

  public applyModuleInstanceBlend(): Promise<never> {
    throw new Error("Unexpected applyModuleInstanceBlend call.");
  }

  public applyModuleInstanceMask(): Promise<never> {
    throw new Error("Unexpected applyModuleInstanceMask call.");
  }

  public applyModuleInstanceAction(request: {
    readonly instanceKey: string;
    readonly action: "move-before";
    readonly anchorInstanceKey: string;
  }): Promise<LiveDarktableModuleInstanceActionMutation> {
    this.requests.push(request);
    return Promise.resolve(this.mutation);
  }
}

function createSession(): {
  readonly view: "darkroom";
  readonly renderSequence: 11;
  readonly historyChangeSequence: 5;
  readonly imageLoadSequence: 2;
} {
  return {
    view: "darkroom" as const,
    renderSequence: 11,
    historyChangeSequence: 5,
    imageLoadSequence: 2
  };
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
  };
}

function createDiagnostics(): {
  readonly helperBinaryPath: "/helper";
  readonly commandArguments: readonly [
    "/helper",
    "apply-module-instance-action",
    "colorbalancergb#0#1#mask",
    "move-before",
    "exposure#0#0#"
  ];
  readonly exitCode: 0;
  readonly elapsedMilliseconds: 8;
} {
  return {
    helperBinaryPath: "/helper",
    commandArguments: [
      "/helper",
      "apply-module-instance-action",
      "colorbalancergb#0#1#mask",
      "move-before",
      "exposure#0#0#"
    ],
    exitCode: 0,
    elapsedMilliseconds: 8
  } as const;
}
