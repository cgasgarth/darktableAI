import type {
  LiveDarktableModuleMaskAction,
  LiveDarktableModuleMaskForm,
  LiveDarktableModuleMaskResult,
  LiveDarktableUnavailableModuleMaskResult
} from "../../application/models/live-darktable-module-mask";

export class DarktableLiveBridgeModuleMaskParser {
  public parse(value: unknown): LiveDarktableModuleMaskResult {
    const record = this.readRecord(value, "moduleMask");

    return {
      targetInstanceKey: this.readString(record["targetInstanceKey"], "moduleMask.targetInstanceKey"),
      action: this.readAction(record["action"], "moduleMask.action"),
      ...(record["sourceInstanceKey"] === undefined
        ? {}
        : { sourceInstanceKey: this.readString(record["sourceInstanceKey"], "moduleMask.sourceInstanceKey") }),
      moduleOp: this.readString(record["moduleOp"], "moduleMask.moduleOp"),
      iopOrder: this.readInteger(record["iopOrder"], "moduleMask.iopOrder"),
      multiPriority: this.readInteger(record["multiPriority"], "moduleMask.multiPriority"),
      multiName: this.readStringValue(record["multiName"], "moduleMask.multiName"),
      previousHasMask: this.readBoolean(record["previousHasMask"], "moduleMask.previousHasMask"),
      currentHasMask: this.readBoolean(record["currentHasMask"], "moduleMask.currentHasMask"),
      changed: this.readBoolean(record["changed"], "moduleMask.changed"),
      previousForms: this.readForms(record["previousForms"], "moduleMask.previousForms"),
      sourceForms: this.readForms(record["sourceForms"], "moduleMask.sourceForms"),
      currentForms: this.readForms(record["currentForms"], "moduleMask.currentForms"),
      historyBefore: this.readInteger(record["historyBefore"], "moduleMask.historyBefore"),
      historyAfter: this.readInteger(record["historyAfter"], "moduleMask.historyAfter"),
      requestedHistoryEnd: this.readInteger(record["requestedHistoryEnd"], "moduleMask.requestedHistoryEnd")
    };
  }

  public parseUnavailable(value: unknown): LiveDarktableUnavailableModuleMaskResult {
    const record = this.readRecord(value, "moduleMask");

    return {
      targetInstanceKey: this.readString(record["targetInstanceKey"], "moduleMask.targetInstanceKey"),
      action: this.readString(record["action"], "moduleMask.action"),
      ...(record["sourceInstanceKey"] === undefined
        ? {}
        : { sourceInstanceKey: this.readString(record["sourceInstanceKey"], "moduleMask.sourceInstanceKey") }),
      ...(record["moduleOp"] === undefined
        ? {}
        : { moduleOp: this.readString(record["moduleOp"], "moduleMask.moduleOp") }),
      ...(record["iopOrder"] === undefined
        ? {}
        : { iopOrder: this.readInteger(record["iopOrder"], "moduleMask.iopOrder") }),
      ...(record["multiPriority"] === undefined
        ? {}
        : { multiPriority: this.readInteger(record["multiPriority"], "moduleMask.multiPriority") }),
      ...(record["multiName"] === undefined
        ? {}
        : { multiName: this.readStringValue(record["multiName"], "moduleMask.multiName") }),
      ...(record["previousHasMask"] === undefined
        ? {}
        : { previousHasMask: this.readBoolean(record["previousHasMask"], "moduleMask.previousHasMask") }),
      ...(record["currentHasMask"] === undefined
        ? {}
        : { currentHasMask: this.readBoolean(record["currentHasMask"], "moduleMask.currentHasMask") }),
      ...(record["changed"] === undefined
        ? {}
        : { changed: this.readBoolean(record["changed"], "moduleMask.changed") }),
      ...(record["previousForms"] === undefined
        ? {}
        : { previousForms: this.readForms(record["previousForms"], "moduleMask.previousForms") }),
      ...(record["sourceForms"] === undefined
        ? {}
        : { sourceForms: this.readForms(record["sourceForms"], "moduleMask.sourceForms") }),
      ...(record["currentForms"] === undefined
        ? {}
        : { currentForms: this.readForms(record["currentForms"], "moduleMask.currentForms") }),
      ...(record["historyBefore"] === undefined
        ? {}
        : { historyBefore: this.readInteger(record["historyBefore"], "moduleMask.historyBefore") }),
      ...(record["historyAfter"] === undefined
        ? {}
        : { historyAfter: this.readInteger(record["historyAfter"], "moduleMask.historyAfter") }),
      ...(record["requestedHistoryEnd"] === undefined
        ? {}
        : {
            requestedHistoryEnd: this.readInteger(
              record["requestedHistoryEnd"],
              "moduleMask.requestedHistoryEnd"
            )
          })
    };
  }

  private readForms(value: unknown, label: string): ReadonlyArray<LiveDarktableModuleMaskForm> {
    if (!Array.isArray(value)) {
      throw new Error(`darktable-live-bridge field '${label}' must be an array.`);
    }

    return value.map((entry, index) => this.readForm(entry, `${label}[${String(index)}]`));
  }

  private readForm(value: unknown, label: string): LiveDarktableModuleMaskForm {
    const record = this.readRecord(value, label);

    return {
      formId: this.readInteger(record["formId"], `${label}.formId`),
      state: this.readInteger(record["state"], `${label}.state`),
      opacity: this.readNumber(record["opacity"], `${label}.opacity`)
    };
  }

  private readAction(value: unknown, label: string): LiveDarktableModuleMaskAction {
    if (value !== "clear-mask" && value !== "reuse-same-shapes") {
      throw new Error(
        `darktable-live-bridge field '${label}' must be 'clear-mask' or 'reuse-same-shapes'.`
      );
    }

    return value;
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
