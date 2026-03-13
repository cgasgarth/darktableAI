import type {
  LiveDarktableSnapshotControl,
  LiveDarktableSnapshotControls,
  LiveDarktableSnapshotHistoryItem,
  LiveDarktableSnapshotModuleState,
  LiveDarktableSnapshotParamField,
  LiveDarktableSnapshotParams,
  LiveDarktableSnapshotState
} from "../../application/models/live-darktable";
import { DarktableLiveBridgeBlendParser } from "./darktable-live-bridge-blend-parser";

export class DarktableLiveBridgeSnapshotParser {
  public constructor(
    private readonly blendParser: DarktableLiveBridgeBlendParser = new DarktableLiveBridgeBlendParser()
  ) {}

  public parse(value: unknown): LiveDarktableSnapshotState {
    const record = this.readRecord(value, "snapshot");
    const appliedHistoryEnd = this.readInteger(record["appliedHistoryEnd"], "snapshot.appliedHistoryEnd");
    const controls = this.readControls(record["controls"]);
    const moduleStack = this.readModuleStateArray(record["moduleStack"], "snapshot.moduleStack");
    const historyItems = this.readHistoryItemArray(record["historyItems"]);

    this.readRequiredControl(controls, "exposure.exposure");
    this.assertSnapshotCoverage(moduleStack, historyItems, appliedHistoryEnd);

    return {
      appliedHistoryEnd,
      controls,
      moduleStack,
      historyItems
    };
  }

  private readControls(value: unknown): LiveDarktableSnapshotControls {
    if (!Array.isArray(value)) {
      throw new Error("darktable-live-bridge field 'snapshot.controls' must be an array.");
    }

    return value.map((control, index) => this.readControl(control, `snapshot.controls[${String(index)}]`));
  }

  private readControl(value: unknown, label: string): LiveDarktableSnapshotControl {
    const record = this.readRecord(value, label);

    return {
      id: this.readString(record["id"], `${label}.id`),
      module: this.readString(record["module"], `${label}.module`),
      control: this.readString(record["control"], `${label}.control`),
      operations: this.readStringArray(record["operations"], `${label}.operations`),
      requires: this.readControlRequirement(record["requires"], `${label}.requires`),
      valueType: this.readControlValueType(record["valueType"], `${label}.valueType`),
      value: this.readRequiredValue(record, "value", `${label}.value`)
    };
  }

  private readRequiredControl(
    controls: LiveDarktableSnapshotControls,
    controlId: string
  ): LiveDarktableSnapshotControl {
    const matchingControls = controls.filter((entry) => entry.id === controlId);

    if (matchingControls.length !== 1) {
      throw new Error(`darktable-live-bridge field 'snapshot.controls' must contain exactly one '${controlId}' entry.`);
    }

    const [control] = matchingControls;

    if (control === undefined) {
      throw new Error(`darktable-live-bridge field 'snapshot.controls' must contain exactly one '${controlId}' entry.`);
    }

    return control;
  }

  private readModuleStateArray(
    value: unknown,
    label: "snapshot.moduleStack" | "snapshot.historyItems"
  ): ReadonlyArray<LiveDarktableSnapshotModuleState> {
    if (!Array.isArray(value)) {
      throw new Error(`darktable-live-bridge field '${label}' must be an array.`);
    }

    return value.map((entry, index) => this.readModuleState(entry, `${label}[${String(index)}]`));
  }

  private readHistoryItemArray(value: unknown): ReadonlyArray<LiveDarktableSnapshotHistoryItem> {
    if (!Array.isArray(value)) {
      throw new Error("darktable-live-bridge field 'snapshot.historyItems' must be an array.");
    }

    return value.map((entry, index) => this.readHistoryItem(entry, `snapshot.historyItems[${String(index)}]`));
  }

  private assertSnapshotCoverage(
    moduleStack: ReadonlyArray<LiveDarktableSnapshotModuleState>,
    historyItems: ReadonlyArray<LiveDarktableSnapshotHistoryItem>,
    appliedHistoryEnd: number
  ): void {
    if (appliedHistoryEnd < 0) {
      throw new Error("darktable-live-bridge field 'snapshot.appliedHistoryEnd' must be non-negative.");
    }

    if (moduleStack.length === 0) {
      throw new Error("darktable-live-bridge field 'snapshot.moduleStack' must not be empty.");
    }

    if (!moduleStack.some((module) => module.moduleOp === "exposure")) {
      throw new Error("darktable-live-bridge field 'snapshot.moduleStack' must include module 'exposure'.");
    }

    if (historyItems.length < appliedHistoryEnd) {
      throw new Error(
        "darktable-live-bridge field 'snapshot.historyItems' must cover the applied history range."
      );
    }

    historyItems.forEach((item, index) => {
      if (item.index !== index) {
        throw new Error(
          `darktable-live-bridge field 'snapshot.historyItems[${String(index)}].index' must equal ${String(index)}.`
        );
      }

      if (index < appliedHistoryEnd && !item.applied) {
        throw new Error(
          `darktable-live-bridge field 'snapshot.historyItems[${String(index)}].applied' must be true within the applied history range.`
        );
      }
    });
  }

  private readModuleState(value: unknown, label: string): LiveDarktableSnapshotModuleState {
    const record = this.readRecord(value, label);

    return {
      instanceKey: this.readString(record["instanceKey"], `${label}.instanceKey`),
      moduleOp: this.readString(record["moduleOp"], `${label}.moduleOp`),
      enabled: this.readBoolean(record["enabled"], `${label}.enabled`),
      iopOrder: this.readInteger(record["iopOrder"], `${label}.iopOrder`),
      multiPriority: this.readInteger(record["multiPriority"], `${label}.multiPriority`),
      multiName: this.readStringValue(record["multiName"], `${label}.multiName`),
      blend: this.blendParser.parseSnapshotBlend(record["blend"], `${label}.blend`),
      params: this.readParams(record["params"], `${label}.params`)
    };
  }

  private readHistoryItem(value: unknown, label: string): LiveDarktableSnapshotHistoryItem {
    const record = this.readRecord(value, label);
    const moduleState = this.readModuleState(value, label);

    return {
      ...moduleState,
      index: this.readInteger(record["index"], `${label}.index`),
      applied: this.readBoolean(record["applied"], `${label}.applied`)
    };
  }

  private readControlRequirement(value: unknown, label: string): LiveDarktableSnapshotControl["requires"] {
    const record = this.readRecord(value, label);

    return {
      activeImage: this.readBoolean(record["activeImage"], `${label}.activeImage`),
      view: this.readString(record["view"], `${label}.view`)
    };
  }

  private readControlValueType(value: unknown, label: string): LiveDarktableSnapshotControl["valueType"] {
    const record = this.readRecord(value, label);

    return {
      type: this.readString(record["type"], `${label}.type`),
      ...(record["minimum"] === undefined
        ? {}
        : { minimum: this.readNumber(record["minimum"], `${label}.minimum`) }),
      ...(record["maximum"] === undefined
        ? {}
        : { maximum: this.readNumber(record["maximum"], `${label}.maximum`) })
    };
  }

  private readParams(value: unknown, label: string): LiveDarktableSnapshotParams {
    const record = this.readRecord(value, label);
    const encoding = record["encoding"];

    if (encoding === "unsupported") {
      return { encoding };
    }

    if (encoding !== "introspection-v1") {
      throw new Error(
        `darktable-live-bridge field '${label}.encoding' must be 'introspection-v1' or 'unsupported'.`
      );
    }

    const fieldsValue = record["fields"];

    if (!Array.isArray(fieldsValue)) {
      throw new Error(`darktable-live-bridge field '${label}.fields' must be an array.`);
    }

    return {
      encoding,
      fields: fieldsValue.map((field, index) => this.readParamField(field, `${label}.fields[${String(index)}]`))
    };
  }

  private readParamField(value: unknown, label: string): LiveDarktableSnapshotParamField {
    const record = this.readRecord(value, label);

    return {
      path: this.readString(record["path"], `${label}.path`),
      kind: this.readString(record["kind"], `${label}.kind`),
      value: this.readRequiredValue(record, "value", `${label}.value`)
    };
  }

  private readRecord(value: unknown, label: string): Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error(`darktable-live-bridge field '${label}' must be an object.`);
    }

    return value as Record<string, unknown>;
  }

  private readRequiredValue(record: Record<string, unknown>, key: string, label: string): unknown {
    if (!(key in record)) {
      throw new Error(`darktable-live-bridge field '${label}' must be present.`);
    }

    return record[key];
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

  private readStringArray(value: unknown, label: string): ReadonlyArray<string> {
    if (!Array.isArray(value)) {
      throw new Error(`darktable-live-bridge field '${label}' must be an array.`);
    }

    return value.map((entry, index) => this.readString(entry, `${label}[${String(index)}]`));
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
