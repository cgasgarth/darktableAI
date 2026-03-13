import { describe, expect, test } from "bun:test";

import type {
  LiveDarktableModuleInstanceActionMutation,
  LiveDarktableSnapshotReadback,
  LiveDarktableSessionSnapshot
} from "../models/live-darktable";
import { ApplyLiveDarktableModuleInstanceAction } from "./apply-live-darktable-module-instance-action";

describe("ApplyLiveDarktableModuleInstanceAction delete", (): void => {
  test("returns helper snapshot for delete mutations without extra readback", async (): Promise<void> => {
    const mutation = {
      bridgeVersion: 1 as const,
      status: "ok" as const,
      session: createSession(),
      activeImage: createActiveImage(),
      moduleAction: {
        targetInstanceKey: "colorbalancergb#7#1#mask",
        action: "delete" as const,
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
        appliedHistoryEnd: 5,
        controls: [createExposureControl()],
        moduleStack: [createModuleState()],
        historyItems: [createHistoryItem()]
      },
      diagnostics: createDiagnostics()
    };
    const gateway = new StubGateway(mutation);
    const useCase = new ApplyLiveDarktableModuleInstanceAction(gateway);

    const result = await useCase.execute({
      instanceKey: "colorbalancergb#7#1#mask",
      action: "delete"
    });

    expect(gateway.requests).toEqual([{ instanceKey: "colorbalancergb#7#1#mask", action: "delete" }]);
    expect(gateway.getSnapshotCalls).toBe(0);
    expect(result).toEqual({
      mutation,
      latestSnapshot: mutation,
      helperCallDiagnostics: [createDiagnostics()]
    });
  });
});

class StubGateway {
  public readonly requests: Array<{ readonly instanceKey: string; readonly action: "delete" }> = [];
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
    readonly action: "delete";
  }): Promise<LiveDarktableModuleInstanceActionMutation> {
    this.requests.push(request);
    return Promise.resolve(this.mutation);
  }
}

function createSession(): {
  readonly view: "darkroom";
  readonly renderSequence: 12;
  readonly historyChangeSequence: 6;
  readonly imageLoadSequence: 2;
} {
  return {
    view: "darkroom" as const,
    renderSequence: 12,
    historyChangeSequence: 6,
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

function createModuleState(): {
  readonly instanceKey: "colorbalancergb#8#2#replacement";
  readonly moduleOp: "colorbalancergb";
  readonly enabled: true;
  readonly iopOrder: 9;
  readonly multiPriority: 2;
  readonly multiName: "replacement";
  readonly blend: {
    readonly supported: false;
    readonly masksSupported: false;
  };
  readonly params: { readonly encoding: "unsupported" };
} {
  return {
    instanceKey: "colorbalancergb#8#2#replacement",
    moduleOp: "colorbalancergb",
    enabled: true,
    iopOrder: 9,
    multiPriority: 2,
    multiName: "replacement",
    blend: { supported: false, masksSupported: false },
    params: { encoding: "unsupported" as const }
  };
}

function createExposureControl(): {
  readonly id: "exposure.exposure";
  readonly module: "exposure";
  readonly control: "exposure";
  readonly operations: readonly ["get", "set"];
  readonly requires: { readonly activeImage: true; readonly view: "darkroom" };
  readonly valueType: { readonly type: "number"; readonly minimum: -3; readonly maximum: 4 };
  readonly value: 0;
} {
  return {
    id: "exposure.exposure",
    module: "exposure",
    control: "exposure",
    operations: ["get", "set"],
    requires: { activeImage: true, view: "darkroom" },
    valueType: { type: "number", minimum: -3, maximum: 4 },
    value: 0
  } as const;
}

function createHistoryItem(): {
  readonly index: 0;
  readonly applied: true;
} & ReturnType<typeof createModuleState> {
  return {
    index: 0,
    applied: true,
    ...createModuleState()
  } as const;
}

function createDiagnostics(): {
  readonly helperBinaryPath: "/helper";
  readonly commandArguments: readonly [
    "/helper",
    "apply-module-instance-action",
    "colorbalancergb#7#1#mask",
    "delete"
  ];
  readonly exitCode: 0;
  readonly elapsedMilliseconds: 8;
} {
  return {
    helperBinaryPath: "/helper",
    commandArguments: ["/helper", "apply-module-instance-action", "colorbalancergb#7#1#mask", "delete"],
    exitCode: 0,
    elapsedMilliseconds: 8
  } as const;
}
