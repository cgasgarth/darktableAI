import type {
  LiveDarktableModuleBlendResult,
  LiveDarktableSnapshotModuleBlend,
  LiveDarktableUnavailableModuleBlendResult
} from "../../application/models/live-darktable";

export class DarktableLiveBridgeBlendParser {
  public parseSnapshotBlend(value: unknown, label: string): LiveDarktableSnapshotModuleBlend {
    const record = this.readRecord(value, label);
    const supported = this.readBoolean(record["supported"], `${label}.supported`);
    const masksSupported = this.readBoolean(record["masksSupported"], `${label}.masksSupported`);

    if (!supported) {
      return {
        supported,
        masksSupported
      };
    }

    return {
      supported,
      masksSupported,
      opacity: this.readNumber(record["opacity"], `${label}.opacity`),
      blendMode: this.readString(record["blendMode"], `${label}.blendMode`),
      reverseOrder: this.readBoolean(record["reverseOrder"], `${label}.reverseOrder`)
    };
  }

  public parseMutation(value: unknown): LiveDarktableModuleBlendResult {
    const record = this.readRecord(value, "moduleBlend");

    return {
      targetInstanceKey: this.readString(record["targetInstanceKey"], "moduleBlend.targetInstanceKey"),
      moduleOp: this.readString(record["moduleOp"], "moduleBlend.moduleOp"),
      iopOrder: this.readInteger(record["iopOrder"], "moduleBlend.iopOrder"),
      multiPriority: this.readInteger(record["multiPriority"], "moduleBlend.multiPriority"),
      multiName: this.readStringValue(record["multiName"], "moduleBlend.multiName"),
      ...(record["previousOpacity"] === undefined
        ? {}
        : { previousOpacity: this.readNumber(record["previousOpacity"], "moduleBlend.previousOpacity") }),
      ...(record["requestedOpacity"] === undefined
        ? {}
        : { requestedOpacity: this.readNumber(record["requestedOpacity"], "moduleBlend.requestedOpacity") }),
      ...(record["currentOpacity"] === undefined
        ? {}
        : { currentOpacity: this.readNumber(record["currentOpacity"], "moduleBlend.currentOpacity") }),
      ...(record["previousBlendMode"] === undefined
        ? {}
        : {
            previousBlendMode: this.readString(
              record["previousBlendMode"],
              "moduleBlend.previousBlendMode"
            )
          }),
      ...(record["requestedBlendMode"] === undefined
        ? {}
        : {
            requestedBlendMode: this.readString(
              record["requestedBlendMode"],
              "moduleBlend.requestedBlendMode"
            )
          }),
      ...(record["currentBlendMode"] === undefined
        ? {}
        : {
            currentBlendMode: this.readString(record["currentBlendMode"], "moduleBlend.currentBlendMode")
          }),
      ...(record["previousReverseOrder"] === undefined
        ? {}
        : {
            previousReverseOrder: this.readBoolean(
              record["previousReverseOrder"],
              "moduleBlend.previousReverseOrder"
            )
          }),
      ...(record["requestedReverseOrder"] === undefined
        ? {}
        : {
            requestedReverseOrder: this.readBoolean(
              record["requestedReverseOrder"],
              "moduleBlend.requestedReverseOrder"
            )
          }),
      ...(record["currentReverseOrder"] === undefined
        ? {}
        : {
            currentReverseOrder: this.readBoolean(
              record["currentReverseOrder"],
              "moduleBlend.currentReverseOrder"
            )
          }),
      historyBefore: this.readInteger(record["historyBefore"], "moduleBlend.historyBefore"),
      historyAfter: this.readInteger(record["historyAfter"], "moduleBlend.historyAfter"),
      requestedHistoryEnd: this.readInteger(record["requestedHistoryEnd"], "moduleBlend.requestedHistoryEnd")
    };
  }

  public parseUnavailable(value: unknown): LiveDarktableUnavailableModuleBlendResult {
    const record = this.readRecord(value, "moduleBlend");

    return {
      targetInstanceKey: this.readString(record["targetInstanceKey"], "moduleBlend.targetInstanceKey"),
      ...(record["moduleOp"] === undefined ? {} : { moduleOp: this.readString(record["moduleOp"], "moduleBlend.moduleOp") }),
      ...(record["iopOrder"] === undefined ? {} : { iopOrder: this.readInteger(record["iopOrder"], "moduleBlend.iopOrder") }),
      ...(record["multiPriority"] === undefined
        ? {}
        : { multiPriority: this.readInteger(record["multiPriority"], "moduleBlend.multiPriority") }),
      ...(record["multiName"] === undefined
        ? {}
        : { multiName: this.readStringValue(record["multiName"], "moduleBlend.multiName") }),
      ...(record["previousOpacity"] === undefined
        ? {}
        : { previousOpacity: this.readNumber(record["previousOpacity"], "moduleBlend.previousOpacity") }),
      ...(record["requestedOpacity"] === undefined
        ? {}
        : { requestedOpacity: this.readNumber(record["requestedOpacity"], "moduleBlend.requestedOpacity") }),
      ...(record["currentOpacity"] === undefined
        ? {}
        : { currentOpacity: this.readNumber(record["currentOpacity"], "moduleBlend.currentOpacity") }),
      ...(record["previousBlendMode"] === undefined
        ? {}
        : {
            previousBlendMode: this.readString(
              record["previousBlendMode"],
              "moduleBlend.previousBlendMode"
            )
          }),
      ...(record["requestedBlendMode"] === undefined
        ? {}
        : {
            requestedBlendMode: this.readString(
              record["requestedBlendMode"],
              "moduleBlend.requestedBlendMode"
            )
          }),
      ...(record["currentBlendMode"] === undefined
        ? {}
        : {
            currentBlendMode: this.readString(record["currentBlendMode"], "moduleBlend.currentBlendMode")
          }),
      ...(record["previousReverseOrder"] === undefined
        ? {}
        : {
            previousReverseOrder: this.readBoolean(
              record["previousReverseOrder"],
              "moduleBlend.previousReverseOrder"
            )
          }),
      ...(record["requestedReverseOrder"] === undefined
        ? {}
        : {
            requestedReverseOrder: this.readBoolean(
              record["requestedReverseOrder"],
              "moduleBlend.requestedReverseOrder"
            )
          }),
      ...(record["currentReverseOrder"] === undefined
        ? {}
        : {
            currentReverseOrder: this.readBoolean(
              record["currentReverseOrder"],
              "moduleBlend.currentReverseOrder"
            )
          }),
      ...(record["historyBefore"] === undefined
        ? {}
        : { historyBefore: this.readInteger(record["historyBefore"], "moduleBlend.historyBefore") }),
      ...(record["historyAfter"] === undefined
        ? {}
        : { historyAfter: this.readInteger(record["historyAfter"], "moduleBlend.historyAfter") }),
      ...(record["requestedHistoryEnd"] === undefined
        ? {}
        : { requestedHistoryEnd: this.readInteger(record["requestedHistoryEnd"], "moduleBlend.requestedHistoryEnd") })
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
}
