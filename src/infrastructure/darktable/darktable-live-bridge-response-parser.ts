import type {
  LiveDarktableActiveImage,
  LiveDarktableAvailableExposureState,
  LiveDarktableAvailableSessionState,
  LiveDarktableCommandDiagnostics,
  LiveDarktableExposureChange,
  LiveDarktableExposureState,
  LiveDarktableSessionState,
  LiveDarktableUnavailableState
} from "../../application/models/live-darktable";

interface LiveBridgePayload {
  readonly bridgeVersion?: unknown;
  readonly status?: unknown;
  readonly reason?: unknown;
  readonly session?: unknown;
  readonly activeImage?: unknown;
  readonly exposure?: unknown;
}

export class DarktableLiveBridgeResponseParser {
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
      session: this.readSession(parsed.session),
      ...(parsed.activeImage === undefined ? {} : { activeImage: this.readActiveImage(parsed.activeImage) }),
      ...(parsed.exposure === undefined ? {} : { exposure: this.readSessionExposure(parsed.exposure) })
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
      session: this.readSession(parsed.session),
      ...(parsed.activeImage === undefined ? {} : { activeImage: this.readActiveImage(parsed.activeImage) }),
      exposure: this.readExposureChange(parsed.exposure)
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
    | LiveDarktableUnavailableState {
    const bridgeVersion = this.readBridgeVersion(payload.bridgeVersion);
    const status = this.readStatus(payload.status);

    if (status === "unavailable") {
      return {
        bridgeVersion,
        status,
        diagnostics,
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

  private readReason(value: unknown): "unsupported-view" | "no-active-image" {
    if (value !== "unsupported-view" && value !== "no-active-image") {
      throw new Error(
        "darktable-live-bridge field 'reason' must be 'unsupported-view' or 'no-active-image'."
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

    return {
      current: this.readNumber(record["current"], "exposure.current")
    };
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

  private readRecord(value: unknown, label: string): Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error(`darktable-live-bridge field '${label}' must be an object.`);
    }

    return value as Record<string, unknown>;
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
    if (typeof value !== "string" || value.length === 0) {
      throw new Error(`darktable-live-bridge field '${label}' must be a non-empty string.`);
    }

    return value;
  }
}
