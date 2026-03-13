import type {
  LiveDarktableDeleteModuleInstanceAction,
  LiveDarktableModuleInstanceAction,
  LiveDarktableModuleInstanceActionResult,
  LiveDarktableReorderModuleInstanceAction,
  LiveDarktableToggleModuleInstanceAction,
  LiveDarktableUnavailableModuleInstanceActionResult
} from "../../application/models/live-darktable";

export class DarktableLiveBridgeModuleActionParser {
  public parse(value: unknown): LiveDarktableModuleInstanceActionResult {
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
      requestedHistoryEnd: this.readInteger(record["requestedHistoryEnd"], "moduleAction.requestedHistoryEnd")
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

    if (this.isReorderModuleInstanceAction(action)) {
      return {
        ...common,
        action,
        anchorInstanceKey: this.readString(record["anchorInstanceKey"], "moduleAction.anchorInstanceKey"),
        previousIopOrder: this.readInteger(record["previousIopOrder"], "moduleAction.previousIopOrder"),
        currentIopOrder: this.readInteger(record["currentIopOrder"], "moduleAction.currentIopOrder")
      };
    }

    if (this.isDeleteModuleInstanceAction(action)) {
      return {
        ...common,
        action,
        ...(record["replacementInstanceKey"] === undefined
          ? {}
          : { replacementInstanceKey: this.readString(record["replacementInstanceKey"], "moduleAction.replacementInstanceKey") }),
        ...(record["replacementIopOrder"] === undefined
          ? {}
          : { replacementIopOrder: this.readInteger(record["replacementIopOrder"], "moduleAction.replacementIopOrder") }),
        ...(record["replacementMultiPriority"] === undefined
          ? {}
          : {
              replacementMultiPriority: this.readInteger(
                record["replacementMultiPriority"],
                "moduleAction.replacementMultiPriority"
              )
            }),
        ...(record["replacementMultiName"] === undefined
          ? {}
          : { replacementMultiName: this.readStringValue(record["replacementMultiName"], "moduleAction.replacementMultiName") })
      };
    }

    return {
      ...common,
      action,
      resultInstanceKey: this.readString(record["resultInstanceKey"], "moduleAction.resultInstanceKey")
    };
  }

  public parseUnavailable(value: unknown): LiveDarktableUnavailableModuleInstanceActionResult {
    const record = this.readRecord(value, "moduleAction");

    return {
      targetInstanceKey: this.readString(record["targetInstanceKey"], "moduleAction.targetInstanceKey"),
      action: this.readString(record["action"], "moduleAction.action"),
      ...(record["anchorInstanceKey"] === undefined
        ? {}
        : { anchorInstanceKey: this.readString(record["anchorInstanceKey"], "moduleAction.anchorInstanceKey") }),
      ...(record["requestedEnabled"] === undefined
        ? {}
        : { requestedEnabled: this.readBoolean(record["requestedEnabled"], "moduleAction.requestedEnabled") }),
      ...(record["resultInstanceKey"] === undefined
        ? {}
        : { resultInstanceKey: this.readString(record["resultInstanceKey"], "moduleAction.resultInstanceKey") }),
      ...(record["replacementInstanceKey"] === undefined
        ? {}
        : { replacementInstanceKey: this.readString(record["replacementInstanceKey"], "moduleAction.replacementInstanceKey") }),
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
      ...(record["replacementIopOrder"] === undefined
        ? {}
        : { replacementIopOrder: this.readInteger(record["replacementIopOrder"], "moduleAction.replacementIopOrder") }),
      ...(record["replacementMultiPriority"] === undefined
        ? {}
        : {
            replacementMultiPriority: this.readInteger(
              record["replacementMultiPriority"],
              "moduleAction.replacementMultiPriority"
            )
          }),
      ...(record["replacementMultiName"] === undefined
        ? {}
        : { replacementMultiName: this.readStringValue(record["replacementMultiName"], "moduleAction.replacementMultiName") }),
      ...(record["previousIopOrder"] === undefined
        ? {}
        : { previousIopOrder: this.readInteger(record["previousIopOrder"], "moduleAction.previousIopOrder") }),
      ...(record["currentIopOrder"] === undefined
        ? {}
        : { currentIopOrder: this.readInteger(record["currentIopOrder"], "moduleAction.currentIopOrder") }),
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
        : { requestedHistoryEnd: this.readInteger(record["requestedHistoryEnd"], "moduleAction.requestedHistoryEnd") })
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
    if (
      value !== "enable" &&
      value !== "disable" &&
      value !== "create" &&
      value !== "duplicate" &&
      value !== "delete" &&
      value !== "move-before" &&
      value !== "move-after"
    ) {
      throw new Error(
        `darktable-live-bridge field '${label}' must be 'enable', 'disable', 'create', 'duplicate', 'delete', 'move-before', or 'move-after'.`
      );
    }

    return value;
  }

  private isToggleModuleInstanceAction(action: LiveDarktableModuleInstanceAction): action is LiveDarktableToggleModuleInstanceAction {
    return action === "enable" || action === "disable";
  }

  private isReorderModuleInstanceAction(action: LiveDarktableModuleInstanceAction): action is LiveDarktableReorderModuleInstanceAction {
    return action === "move-before" || action === "move-after";
  }

  private isDeleteModuleInstanceAction(action: LiveDarktableModuleInstanceAction): action is LiveDarktableDeleteModuleInstanceAction {
    return action === "delete";
  }
}
