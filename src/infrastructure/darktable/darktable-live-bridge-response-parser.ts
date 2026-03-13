import type {
  LiveDarktableActiveImage,
  LiveDarktableAvailableExposureState,
  LiveDarktableAvailableModuleBlendState,
  LiveDarktableAvailableModuleInstanceActionState,
  LiveDarktableAvailableSessionState,
  LiveDarktableAvailableSnapshotState,
  LiveDarktableCommandDiagnostics,
  LiveDarktableExposureChange,
  LiveDarktableExposureState,
  LiveDarktableSessionState,
  LiveDarktableUnavailableReason,
  LiveDarktableUnavailableState
} from "../../application/models/live-darktable";
import type {
  LiveDarktableAvailableModuleMaskState,
  LiveDarktableModuleMaskUnavailableReason,
  LiveDarktableUnavailableModuleMaskState
} from "../../application/models/live-darktable-module-mask";
import { DarktableLiveBridgeBlendParser } from "./darktable-live-bridge-blend-parser";
import { DarktableLiveBridgeModuleMaskParser } from "./darktable-live-bridge-module-mask-parser";
import { DarktableLiveBridgeModuleActionParser } from "./darktable-live-bridge-module-action-parser";
import { DarktableLiveBridgeSnapshotParser } from "./darktable-live-bridge-snapshot-parser";

interface LiveBridgePayload {
  readonly bridgeVersion?: unknown;
  readonly status?: unknown;
  readonly reason?: unknown;
  readonly session?: unknown;
  readonly activeImage?: unknown;
  readonly exposure?: unknown;
  readonly snapshot?: unknown;
  readonly moduleAction?: unknown;
  readonly moduleBlend?: unknown;
  readonly moduleMask?: unknown;
}

export class DarktableLiveBridgeResponseParser {
  public constructor(
    private readonly snapshotParser: DarktableLiveBridgeSnapshotParser = new DarktableLiveBridgeSnapshotParser(),
    private readonly moduleActionParser: DarktableLiveBridgeModuleActionParser = new DarktableLiveBridgeModuleActionParser(),
    private readonly blendParser: DarktableLiveBridgeBlendParser = new DarktableLiveBridgeBlendParser(),
    private readonly moduleMaskParser: DarktableLiveBridgeModuleMaskParser = new DarktableLiveBridgeModuleMaskParser()
  ) {}

  public parseGetSession(
    stdout: string,
    diagnostics: LiveDarktableCommandDiagnostics
  ): LiveDarktableAvailableSessionState | LiveDarktableUnavailableState {
    const parsed = this.parsePayload(stdout);
    const common = this.readCommonFields(parsed, diagnostics);
    if (common.status === "unavailable") return common;

    return {
      ...common,
      ...(parsed.activeImage === undefined ? {} : { activeImage: this.readActiveImage(parsed.activeImage) }),
      ...(parsed.exposure === undefined ? {} : { exposure: this.readSessionExposure(parsed.exposure) })
    };
  }

  public parseGetSnapshot(
    stdout: string,
    diagnostics: LiveDarktableCommandDiagnostics
  ): LiveDarktableAvailableSnapshotState | LiveDarktableUnavailableState {
    const parsed = this.parsePayload(stdout);
    const common = this.readCommonFields(parsed, diagnostics);
    if (common.status === "unavailable") return common;

    return {
      ...common,
      activeImage: this.readActiveImage(parsed.activeImage),
      snapshot: this.snapshotParser.parse(parsed.snapshot)
    };
  }

  public parseSetExposure(
    stdout: string,
    diagnostics: LiveDarktableCommandDiagnostics
  ): LiveDarktableAvailableExposureState | LiveDarktableUnavailableState {
    const parsed = this.parsePayload(stdout);
    const common = this.readCommonFields(parsed, diagnostics);
    if (common.status === "unavailable") return common;

    return {
      ...common,
      ...(parsed.activeImage === undefined ? {} : { activeImage: this.readActiveImage(parsed.activeImage) }),
      exposure: this.readExposureChange(parsed.exposure)
    };
  }

  public parseApplyModuleInstanceAction(
    stdout: string,
    diagnostics: LiveDarktableCommandDiagnostics
  ): LiveDarktableAvailableModuleInstanceActionState | LiveDarktableUnavailableState {
    const parsed = this.parsePayload(stdout);
    const common = this.readCommonFields(parsed, diagnostics);
    if (common.status === "unavailable") return common;

    return {
      ...common,
      activeImage: this.readActiveImage(parsed.activeImage),
      moduleAction: this.moduleActionParser.parse(parsed.moduleAction),
      snapshot: this.snapshotParser.parse(parsed.snapshot)
    };
  }

  public parseApplyModuleInstanceBlend(
    stdout: string,
    diagnostics: LiveDarktableCommandDiagnostics
  ): LiveDarktableAvailableModuleBlendState | LiveDarktableUnavailableState {
    const parsed = this.parsePayload(stdout);
    const bridgeVersion = this.readBridgeVersion(parsed.bridgeVersion);
    const status = this.readStatus(parsed.status);

    if (status === "unavailable") {
      return {
        bridgeVersion,
        status,
        diagnostics,
        ...(parsed.session === undefined ? {} : { session: this.readSession(parsed.session) }),
        ...(parsed.activeImage === undefined ? {} : { activeImage: this.readActiveImage(parsed.activeImage) }),
        moduleBlend: this.blendParser.parseUnavailable(parsed.moduleBlend),
        ...(parsed.reason === undefined ? {} : { reason: this.readBlendReason(parsed.reason) })
      };
    }

    return {
      bridgeVersion,
      status,
      diagnostics,
      session: this.readSession(parsed.session),
      activeImage: this.readActiveImage(parsed.activeImage),
      moduleBlend: this.blendParser.parseMutation(parsed.moduleBlend),
      snapshot: this.snapshotParser.parse(parsed.snapshot)
    };
  }

  public parseApplyModuleInstanceMask(
    stdout: string,
    diagnostics: LiveDarktableCommandDiagnostics
  ): LiveDarktableAvailableModuleMaskState | LiveDarktableUnavailableModuleMaskState {
    const parsed = this.parsePayload(stdout);
    const bridgeVersion = this.readBridgeVersion(parsed.bridgeVersion);
    const status = this.readStatus(parsed.status);

    if (status === "unavailable") {
      return {
        bridgeVersion,
        status,
        diagnostics,
        ...(parsed.session === undefined ? {} : { session: this.readSession(parsed.session) }),
        ...(parsed.activeImage === undefined ? {} : { activeImage: this.readActiveImage(parsed.activeImage) }),
        moduleMask: this.moduleMaskParser.parseUnavailable(parsed.moduleMask),
        ...(parsed.reason === undefined ? {} : { reason: this.readMaskReason(parsed.reason) })
      };
    }

    return {
      bridgeVersion,
      status,
      diagnostics,
      session: this.readSession(parsed.session),
      activeImage: this.readActiveImage(parsed.activeImage),
      moduleMask: this.moduleMaskParser.parse(parsed.moduleMask),
      snapshot: this.snapshotParser.parse(parsed.snapshot)
    };
  }

  private parsePayload(stdout: string): LiveBridgePayload {
    try {
      return JSON.parse(stdout) as LiveBridgePayload;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown JSON parse error.";
      throw new Error(`darktable-live-bridge returned invalid JSON: ${message}`);
    }
  }

  private readCommonFields(
    payload: LiveBridgePayload,
    diagnostics: LiveDarktableCommandDiagnostics
  ):
    | LiveDarktableAvailableSessionState
    | LiveDarktableAvailableExposureState
    | LiveDarktableAvailableModuleBlendState
    | LiveDarktableAvailableSnapshotState
    | LiveDarktableAvailableModuleInstanceActionState
    | LiveDarktableUnavailableState {
    const bridgeVersion = this.readBridgeVersion(payload.bridgeVersion);
    const status = this.readStatus(payload.status);

    if (status === "unavailable") {
      return {
        bridgeVersion,
        status,
        diagnostics,
        ...(payload.session === undefined ? {} : { session: this.readSession(payload.session) }),
        ...(payload.activeImage === undefined ? {} : { activeImage: this.readActiveImage(payload.activeImage) }),
        ...(payload.moduleAction === undefined
          ? {}
          : { moduleAction: this.moduleActionParser.parseUnavailable(payload.moduleAction) }),
        ...(payload.moduleBlend === undefined
          ? {}
          : { moduleBlend: this.blendParser.parseUnavailable(payload.moduleBlend) }),
        ...(payload.reason === undefined ? {} : { reason: this.readReason(payload.reason) })
      };
    }

    return {
      bridgeVersion,
      status,
      diagnostics,
      session: this.readSession(payload.session)
    };
  }

  private readBridgeVersion(value: unknown): 1 {
    if (value !== 1) throw new Error("darktable-live-bridge field 'bridgeVersion' must equal 1.");
    return 1;
  }

  private readStatus(value: unknown): "ok" | "unavailable" {
    if (value !== "ok" && value !== "unavailable") {
      throw new Error("darktable-live-bridge field 'status' must be 'ok' or 'unavailable'.");
    }
    return value;
  }

  private readReason(value: unknown): LiveDarktableUnavailableReason {
    if (
      value !== "unsupported-view" &&
      value !== "no-active-image" &&
      value !== "unknown-instance-key" &&
      value !== "unknown-anchor-instance-key" &&
      value !== "unsupported-module-blend" &&
      value !== "unsupported-module-blend-mode" &&
      value !== "unsupported-module-action" &&
      value !== "unsupported-module-state" &&
      value !== "module-action-failed" &&
      value !== "module-blend-failed" &&
      value !== "module-delete-blocked-last-instance" &&
      value !== "module-reorder-blocked-by-fence" &&
      value !== "module-reorder-blocked-by-rule" &&
      value !== "module-reorder-no-op" &&
      value !== "snapshot-unavailable"
    ) {
      throw new Error(
        "darktable-live-bridge field 'reason' must be 'unsupported-view', 'no-active-image', 'unknown-instance-key', 'unknown-anchor-instance-key', 'unsupported-module-blend', 'unsupported-module-blend-mode', 'unsupported-module-action', 'unsupported-module-state', 'module-action-failed', 'module-blend-failed', 'module-delete-blocked-last-instance', 'module-reorder-blocked-by-fence', 'module-reorder-blocked-by-rule', 'module-reorder-no-op', or 'snapshot-unavailable'."
      );
    }
    return value;
  }

  private readBlendReason(value: unknown): LiveDarktableUnavailableReason {
    if (
      value !== "unsupported-view" &&
      value !== "no-active-image" &&
      value !== "unknown-instance-key" &&
      value !== "unsupported-module-blend" &&
      value !== "unsupported-module-blend-mode" &&
      value !== "module-blend-failed" &&
      value !== "snapshot-unavailable"
    ) {
      throw new Error(
        "darktable-live-bridge field 'reason' must be 'unsupported-view', 'no-active-image', 'unknown-instance-key', 'unsupported-module-blend', 'unsupported-module-blend-mode', 'module-blend-failed', or 'snapshot-unavailable' for module blend responses."
      );
    }

    return value;
  }

  private readMaskReason(value: unknown): LiveDarktableModuleMaskUnavailableReason {
    if (
      value !== "unsupported-view" &&
      value !== "no-active-image" &&
      value !== "unknown-instance-key" &&
      value !== "unknown-source-instance-key" &&
      value !== "unsupported-module-mask" &&
      value !== "source-module-mask-unavailable" &&
      value !== "target-module-mask-not-clear" &&
      value !== "module-mask-failed" &&
      value !== "snapshot-unavailable"
    ) {
      throw new Error(
        "darktable-live-bridge field 'reason' must be 'unsupported-view', 'no-active-image', 'unknown-instance-key', 'unknown-source-instance-key', 'unsupported-module-mask', 'source-module-mask-unavailable', 'target-module-mask-not-clear', 'module-mask-failed', or 'snapshot-unavailable' for module mask responses."
      );
    }

    return value;
  }

  private readSession(value: unknown): LiveDarktableSessionState {
    const record = this.readRecord(value, "session");
    return {
      view: this.readString(record["view"], "session.view"),
      renderSequence: this.readInteger(record["renderSequence"], "session.renderSequence"),
      historyChangeSequence: this.readInteger(record["historyChangeSequence"], "session.historyChangeSequence"),
      imageLoadSequence: this.readInteger(record["imageLoadSequence"], "session.imageLoadSequence")
    };
  }

  private readActiveImage(value: unknown): LiveDarktableActiveImage {
    const record = this.readRecord(value, "activeImage");
    return {
      imageId: this.readInteger(record["imageId"], "activeImage.imageId"),
      directoryPath: this.readString(record["directoryPath"], "activeImage.directoryPath"),
      fileName: this.readString(record["fileName"], "activeImage.fileName"),
      sourceAssetPath: this.readString(record["sourceAssetPath"], "activeImage.sourceAssetPath")
    };
  }

  private readSessionExposure(value: unknown): LiveDarktableExposureState {
    const record = this.readRecord(value, "exposure");
    return { current: this.readNumber(record["current"], "exposure.current") };
  }

  private readExposureChange(value: unknown): LiveDarktableExposureChange {
    const record = this.readRecord(value, "exposure");
    return {
      previous: this.readNumber(record["previous"], "exposure.previous"),
      requested: this.readNumber(record["requested"], "exposure.requested"),
      current: this.readNumber(record["current"], "exposure.current"),
      requestedRenderSequence: this.readInteger(record["requestedRenderSequence"], "exposure.requestedRenderSequence")
    };
  }

  private readRecord(value: unknown, label: string): Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error(`darktable-live-bridge field '${label}' must be an object.`);
    }
    return value as Record<string, unknown>;
  }

  private readInteger(value: unknown, label: string): number {
    const parsed = this.readNumber(value, label);
    if (!Number.isInteger(parsed)) throw new Error(`darktable-live-bridge field '${label}' must be an integer.`);
    return parsed;
  }

  private readNumber(value: unknown, label: string): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`darktable-live-bridge field '${label}' must be a finite number.`);
    }
    return value;
  }

  private readString(value: unknown, label: string): string {
    if (typeof value !== "string" || value.length === 0) {
      throw new Error(`darktable-live-bridge field '${label}' must be a non-empty string.`);
    }
    return value;
  }
}
