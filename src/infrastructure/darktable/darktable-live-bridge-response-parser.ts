import type {
  LiveDarktableActiveImage,
  LiveDarktableAvailableExposureState,
  LiveDarktableAvailableModuleInstanceActionState,
  LiveDarktableAvailableSessionState,
  LiveDarktableAvailableSnapshotState,
  LiveDarktableCommandDiagnostics,
  LiveDarktableExposureChange,
  LiveDarktableExposureState,
  LiveDarktableModuleInstanceAction,
  LiveDarktableModuleInstanceActionResult,
  LiveDarktableToggleModuleInstanceAction,
  LiveDarktableUnavailableModuleInstanceActionResult,
  LiveDarktableSessionState,
  LiveDarktableUnavailableReason,
  LiveDarktableUnavailableState
} from "../../application/models/live-darktable";
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
}

export class DarktableLiveBridgeResponseParser {
  public constructor(
    private readonly snapshotParser: DarktableLiveBridgeSnapshotParser =
      new DarktableLiveBridgeSnapshotParser()
  ) {}

  public parseGetSession(
    stdout: string,
    diagnostics: LiveDarktableCommandDiagnostics
  ): LiveDarktableAvailableSessionState | LiveDarktableUnavailableState {
    const parsed = this.parsePayload(stdout);
    const common = this.readCommonFields(parsed, diagnostics);

    if (common.status === "unavailable") {
      return common;
    }

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

    if (common.status === "unavailable") {
      return common;
    }

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

    if (common.status === "unavailable") {
      return common;
    }

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

    if (common.status === "unavailable") {
      return common;
    }

    return {
      ...common,
      activeImage: this.readActiveImage(parsed.activeImage),
      moduleAction: this.readModuleAction(parsed.moduleAction),
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
          : { moduleAction: this.readUnavailableModuleAction(payload.moduleAction) }),
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
    if (value !== 1) {
      throw new Error("darktable-live-bridge field 'bridgeVersion' must equal 1.");
    }

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
      value !== "unsupported-module-action" &&
      value !== "unsupported-module-state" &&
      value !== "module-action-failed" &&
      value !== "snapshot-unavailable"
    ) {
      throw new Error(
        "darktable-live-bridge field 'reason' must be 'unsupported-view', 'no-active-image', 'unknown-instance-key', 'unsupported-module-action', 'unsupported-module-state', 'module-action-failed', or 'snapshot-unavailable'."
      );
    }

    return value;
  }

  private readSession(value: unknown): LiveDarktableSessionState {
    const record = this.readRecord(value, "session");

    return {
      view: this.readString(record["view"], "session.view"),
      renderSequence: this.readInteger(record["renderSequence"], "session.renderSequence"),
      historyChangeSequence: this.readInteger(
        record["historyChangeSequence"],
        "session.historyChangeSequence"
      ),
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
      requestedRenderSequence: this.readInteger(
        record["requestedRenderSequence"],
        "exposure.requestedRenderSequence"
      )
    };
  }

  private readModuleAction(value: unknown): LiveDarktableModuleInstanceActionResult {
    const record = this.readRecord(value, "moduleAction");
    const action = this.readModuleInstanceAction(record["action"], "moduleAction.action");
    const common = {
      targetInstanceKey: this.readString(record["targetInstanceKey"], "moduleAction.targetInstanceKey"),
      action,
      moduleOp: this.readString(record["moduleOp"], "moduleAction.moduleOp"),
      iopOrder: this.readInteger(record["iopOrder"], "moduleAction.iopOrder"),
      multiPriority: this.readInteger(record["multiPriority"], "moduleAction.multiPriority"),
      multiName: this.readStringValue(record["multiName"], "moduleAction.multiName"),
      historyBefore: this.readInteger(record["historyBefore"], "moduleAction.historyBefore"),
      historyAfter: this.readInteger(record["historyAfter"], "moduleAction.historyAfter"),
      requestedHistoryEnd: this.readInteger(
        record["requestedHistoryEnd"],
        "moduleAction.requestedHistoryEnd"
      )
    };

    if (this.isToggleModuleInstanceAction(action)) {
      return {
        ...common,
        action,
        requestedEnabled: this.readBoolean(record["requestedEnabled"], "moduleAction.requestedEnabled"),
        previousEnabled: this.readBoolean(record["previousEnabled"], "moduleAction.previousEnabled"),
        currentEnabled: this.readBoolean(record["currentEnabled"], "moduleAction.currentEnabled"),
        changed: this.readBoolean(record["changed"], "moduleAction.changed")
      };
    }

    return {
      ...common,
      action,
      resultInstanceKey: this.readString(record["resultInstanceKey"], "moduleAction.resultInstanceKey")
    };
  }

  private readUnavailableModuleAction(value: unknown): LiveDarktableUnavailableModuleInstanceActionResult {
    const record = this.readRecord(value, "moduleAction");

    return {
      targetInstanceKey: this.readString(record["targetInstanceKey"], "moduleAction.targetInstanceKey"),
      action: this.readString(record["action"], "moduleAction.action"),
      ...(record["requestedEnabled"] === undefined
        ? {}
        : { requestedEnabled: this.readBoolean(record["requestedEnabled"], "moduleAction.requestedEnabled") }),
      ...(record["resultInstanceKey"] === undefined
        ? {}
        : { resultInstanceKey: this.readString(record["resultInstanceKey"], "moduleAction.resultInstanceKey") }),
      ...(record["moduleOp"] === undefined
        ? {}
        : { moduleOp: this.readString(record["moduleOp"], "moduleAction.moduleOp") }),
      ...(record["iopOrder"] === undefined
        ? {}
        : { iopOrder: this.readInteger(record["iopOrder"], "moduleAction.iopOrder") }),
      ...(record["multiPriority"] === undefined
        ? {}
        : { multiPriority: this.readInteger(record["multiPriority"], "moduleAction.multiPriority") }),
      ...(record["multiName"] === undefined
        ? {}
        : { multiName: this.readStringValue(record["multiName"], "moduleAction.multiName") }),
      ...(record["previousEnabled"] === undefined
        ? {}
        : { previousEnabled: this.readBoolean(record["previousEnabled"], "moduleAction.previousEnabled") }),
      ...(record["currentEnabled"] === undefined
        ? {}
        : { currentEnabled: this.readBoolean(record["currentEnabled"], "moduleAction.currentEnabled") }),
      ...(record["changed"] === undefined
        ? {}
        : { changed: this.readBoolean(record["changed"], "moduleAction.changed") }),
      ...(record["historyBefore"] === undefined
        ? {}
        : { historyBefore: this.readInteger(record["historyBefore"], "moduleAction.historyBefore") }),
      ...(record["historyAfter"] === undefined
        ? {}
        : { historyAfter: this.readInteger(record["historyAfter"], "moduleAction.historyAfter") }),
      ...(record["requestedHistoryEnd"] === undefined
        ? {}
        : {
            requestedHistoryEnd: this.readInteger(
              record["requestedHistoryEnd"],
              "moduleAction.requestedHistoryEnd"
            )
          })
    };
  }

  private readRecord(value: unknown, label: string): Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error(`darktable-live-bridge field '${label}' must be an object.`);
    }

    return value as Record<string, unknown>;
  }

  private readBoolean(value: unknown, label: string): boolean {
    if (typeof value !== "boolean") {
      throw new Error(`darktable-live-bridge field '${label}' must be a boolean.`);
    }

    return value;
  }

  private readInteger(value: unknown, label: string): number {
    const parsed = this.readNumber(value, label);

    if (!Number.isInteger(parsed)) {
      throw new Error(`darktable-live-bridge field '${label}' must be an integer.`);
    }

    return parsed;
  }

  private readNumber(value: unknown, label: string): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`darktable-live-bridge field '${label}' must be a finite number.`);
    }

    return value;
  }

  private readString(value: unknown, label: string): string {
    const parsed = this.readStringValue(value, label);

    if (parsed.length === 0) {
      throw new Error(`darktable-live-bridge field '${label}' must be a non-empty string.`);
    }

    return parsed;
  }

  private readStringValue(value: unknown, label: string): string {
    if (typeof value !== "string") {
      throw new Error(`darktable-live-bridge field '${label}' must be a string.`);
    }

    return value;
  }

  private readModuleInstanceAction(value: unknown, label: string): LiveDarktableModuleInstanceAction {
    if (value !== "enable" && value !== "disable" && value !== "create" && value !== "duplicate") {
      throw new Error(
        `darktable-live-bridge field '${label}' must be 'enable', 'disable', 'create', or 'duplicate'.`
      );
    }

    return value;
  }

  private isToggleModuleInstanceAction(
    action: LiveDarktableModuleInstanceAction
  ): action is LiveDarktableToggleModuleInstanceAction {
    return action === "enable" || action === "disable";
  }
}
