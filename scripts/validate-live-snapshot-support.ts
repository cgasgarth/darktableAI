export interface ValidateLiveSnapshotInput {
  readonly snapshotResponse: JsonRecord;
  readonly assetPath: string;
  readonly liveBridgePath: string;
}

export interface SnapshotSmokeOutcome {
  readonly mode: "snapshot-readback";
  readonly note: string;
}

type JsonRecord = Record<string, unknown>;

export function validateLiveSnapshot(input: ValidateLiveSnapshotInput): SnapshotSmokeOutcome {
  const payload = input.snapshotResponse;

  assertString(payload, "requestId", "live-session-snapshot");
  assertEquals(
    readNumber(payload, "bridgeVersion", "live-session-snapshot"),
    1,
    "live-session-snapshot bridgeVersion must equal 1."
  );
  assertEquals(
    readString(payload, "status", "live-session-snapshot"),
    "ok",
    "live-session-snapshot status must be 'ok'."
  );

  const diagnostics = readRecord(payload, "diagnostics", "live-session-snapshot");
  assertEquals(
    readString(diagnostics, "helperBinaryPath", "live-session-snapshot diagnostics"),
    input.liveBridgePath,
    "live-session-snapshot helper path changed unexpectedly."
  );
  assertEquals(
    readNumber(diagnostics, "exitCode", "live-session-snapshot diagnostics"),
    0,
    "live-session-snapshot diagnostics exitCode changed unexpectedly."
  );
  assert(
    readNumber(diagnostics, "elapsedMilliseconds", "live-session-snapshot diagnostics") >= 0,
    "live-session-snapshot diagnostics elapsedMilliseconds must be non-negative."
  );
  assertCommandArguments(
    diagnostics,
    [input.liveBridgePath, "get-snapshot"],
    "live-session-snapshot diagnostics"
  );

  const session = readRecord(payload, "session", "live-session-snapshot");
  const activeImage = readRecord(payload, "activeImage", "live-session-snapshot");
  const snapshot = readRecord(payload, "snapshot", "live-session-snapshot");
  const controls = readArray(snapshot, "controls", "live-session-snapshot snapshot");
  const exposureControls = controls
    .map((value, index) => readRecordAt(controls, index, "live-session-snapshot snapshot controls"))
    .filter((control) => control["id"] === "exposure.exposure");

  assertEquals(
    exposureControls.length,
    1,
    "live-session-snapshot snapshot controls must contain exactly one 'exposure.exposure' entry."
  );
  const [exposureControl] = exposureControls;
  assert(exposureControl !== undefined, "live-session-snapshot snapshot controls must include 'exposure.exposure'.");
  assertEquals(
    readString(exposureControl, "module", "live-session-snapshot exposure control"),
    "exposure",
    "live-session-snapshot exposure control module changed unexpectedly."
  );
  assertEquals(
    readString(exposureControl, "control", "live-session-snapshot exposure control"),
    "exposure",
    "live-session-snapshot exposure control name changed unexpectedly."
  );

  assertEquals(
    readString(session, "view", "live-session-snapshot session"),
    "darkroom",
    "live-session-snapshot must attach to the darkroom view."
  );
  readInteger(session, "renderSequence", "live-session-snapshot session");
  readInteger(session, "historyChangeSequence", "live-session-snapshot session");
  readInteger(session, "imageLoadSequence", "live-session-snapshot session");
  readInteger(activeImage, "imageId", "live-session-snapshot activeImage");
  assertString(activeImage, "directoryPath", "live-session-snapshot activeImage");
  assertString(activeImage, "fileName", "live-session-snapshot activeImage");
  assertEquals(
    readString(activeImage, "sourceAssetPath", "live-session-snapshot activeImage"),
    input.assetPath,
    "live-session-snapshot resolved the wrong active asset."
  );
  assert(readInteger(snapshot, "appliedHistoryEnd", "live-session-snapshot snapshot") >= 0,
    "live-session-snapshot appliedHistoryEnd must be non-negative.");
  assert("value" in exposureControl, "live-session-snapshot exposure.exposure control must include a value.");
  assertFiniteNumber(
    exposureControl["value"],
    "live-session-snapshot exposure.exposure control value must be a finite number."
  );
  assertEquals(
    JSON.stringify(readStringArray(exposureControl, "operations", "live-session-snapshot exposure control")),
    JSON.stringify(["get", "set"]),
    "live-session-snapshot exposure control operations changed unexpectedly."
  );

  const requires = readRecord(exposureControl, "requires", "live-session-snapshot exposure control");
  assertEquals(
    readBoolean(requires, "activeImage", "live-session-snapshot exposure control requires"),
    true,
    "live-session-snapshot exposure control requires.activeImage changed unexpectedly."
  );
  assertEquals(
    readString(requires, "view", "live-session-snapshot exposure control requires"),
    "darkroom",
    "live-session-snapshot exposure control requires.view changed unexpectedly."
  );

  const valueType = readRecord(exposureControl, "valueType", "live-session-snapshot exposure control");
  assertEquals(
    readString(valueType, "type", "live-session-snapshot exposure control valueType"),
    "number",
    "live-session-snapshot exposure control valueType.type changed unexpectedly."
  );
  assertEquals(
    readNumber(valueType, "minimum", "live-session-snapshot exposure control valueType"),
    -3,
    "live-session-snapshot exposure control valueType.minimum changed unexpectedly."
  );
  assertEquals(
    readNumber(valueType, "maximum", "live-session-snapshot exposure control valueType"),
    4,
    "live-session-snapshot exposure control valueType.maximum changed unexpectedly."
  );

  const moduleStack = readArray(snapshot, "moduleStack", "live-session-snapshot snapshot");
  const historyItems = readArray(snapshot, "historyItems", "live-session-snapshot snapshot");

  assert(moduleStack.length >= 1, "live-session-snapshot snapshot moduleStack must not be empty.");
  assert(
    historyItems.length >= readInteger(snapshot, "appliedHistoryEnd", "live-session-snapshot snapshot"),
    "live-session-snapshot snapshot historyItems must cover the applied history range."
  );

  validateModuleEntries(moduleStack, "live-session-snapshot snapshot moduleStack");
  validateHistoryEntries(
    historyItems,
    readInteger(snapshot, "appliedHistoryEnd", "live-session-snapshot snapshot"),
    "live-session-snapshot snapshot historyItems"
  );
  assert(
    moduleStack
      .map((value, index) => readRecordAt(moduleStack, index, "live-session-snapshot snapshot moduleStack"))
      .some((entry) => entry["moduleOp"] === "exposure"),
    "live-session-snapshot snapshot moduleStack must include module 'exposure'."
  );

  return {
    mode: "snapshot-readback",
    note: "Snapshot readback returned active-image state, controls, and module/history payloads."
  };
}

function validateModuleEntries(values: ReadonlyArray<unknown>, label: string): void {
  for (const [index] of values.entries()) {
    const entry = readRecordAt(values, index, label);
    assertString(entry, "instanceKey", `${label}[${String(index)}]`);
    assertString(entry, "moduleOp", `${label}[${String(index)}]`);
    assertBoolean(entry, "enabled", `${label}[${String(index)}]`);
    readInteger(entry, "iopOrder", `${label}[${String(index)}]`);
    readInteger(entry, "multiPriority", `${label}[${String(index)}]`);
    assertStringValue(entry, "multiName", `${label}[${String(index)}]`);

    const params = readRecord(entry, "params", `${label}[${String(index)}]`);
    const encoding = readString(params, "encoding", `${label}[${String(index)}] params`);

    if (encoding === "unsupported") {
      continue;
    }

    assertEquals(
      encoding,
      "introspection-v1",
      `${label}[${String(index)}] params encoding changed unexpectedly.`
    );

    const fields = readArray(params, "fields", `${label}[${String(index)}] params`);

    for (const [fieldIndex] of fields.entries()) {
      const field = readRecordAt(fields, fieldIndex, `${label}[${String(index)}] params fields`);
      assertString(field, "path", `${label}[${String(index)}] params fields[${String(fieldIndex)}]`);
      assertString(field, "kind", `${label}[${String(index)}] params fields[${String(fieldIndex)}]`);
      assert(
        "value" in field,
        `${label}[${String(index)}] params fields[${String(fieldIndex)}] must include a value.`
      );
    }
  }
}

function validateHistoryEntries(values: ReadonlyArray<unknown>, appliedHistoryEnd: number, label: string): void {
  for (const [index] of values.entries()) {
    const entry = readRecordAt(values, index, label);
    assertEquals(
      readInteger(entry, "index", `${label}[${String(index)}]`),
      index,
      `${label}[${String(index)}] index changed unexpectedly.`
    );
    assertBoolean(entry, "applied", `${label}[${String(index)}]`);
    if (index < appliedHistoryEnd) {
      assert(
        entry["applied"] === true,
        `${label}[${String(index)}] must be marked applied within the applied history range.`
      );
    }
    validateModuleEntries([entry], label);
  }
}

function assertCommandArguments(record: JsonRecord, expected: ReadonlyArray<string>, label: string): void {
  const commandArguments = readArray(record, "commandArguments", label).map((value) => {
    if (typeof value !== "string") {
      throw new Error(`${label} commandArguments must contain only strings.`);
    }

    return value;
  });

  assertEquals(
    JSON.stringify(commandArguments),
    JSON.stringify(expected),
    `${label} command arguments changed unexpectedly.`
  );
}

function readRecord(record: JsonRecord, key: string, label: string): JsonRecord {
  const value = record[key];

  if (!isRecord(value)) {
    throw new Error(`${label} field '${key}' must be an object.`);
  }

  return value;
}

function readRecordAt(values: ReadonlyArray<unknown>, index: number, label: string): JsonRecord {
  const value = values[index];

  if (!isRecord(value)) {
    throw new Error(`${label}[${String(index)}] must be an object.`);
  }

  return value;
}

function readArray(record: JsonRecord, key: string, label: string): ReadonlyArray<unknown> {
  const value = record[key];

  if (!Array.isArray(value)) {
    throw new Error(`${label} field '${key}' must be an array.`);
  }

  return value;
}

function readStringArray(record: JsonRecord, key: string, label: string): ReadonlyArray<string> {
  return readArray(record, key, label).map((value, index) => {
    if (typeof value !== "string") {
      throw new Error(`${label} field '${key}[${String(index)}]' must be a string.`);
    }

    return value;
  });
}

function readString(record: JsonRecord, key: string, label: string): string {
  const value = record[key];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} field '${key}' must be a non-empty string.`);
  }

  return value;
}

function readNumber(record: JsonRecord, key: string, label: string): number {
  const value = record[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} field '${key}' must be a finite number.`);
  }

  return value;
}

function readInteger(record: JsonRecord, key: string, label: string): number {
  const value = readNumber(record, key, label);

  if (!Number.isInteger(value)) {
    throw new Error(`${label} field '${key}' must be an integer.`);
  }

  return value;
}

function assertString(record: JsonRecord, key: string, label: string): void {
  readString(record, key, label);
}

function assertStringValue(record: JsonRecord, key: string, label: string): void {
  const value = record[key];

  if (typeof value !== "string") {
    throw new Error(`${label} field '${key}' must be a string.`);
  }
}

function readBoolean(record: JsonRecord, key: string, label: string): boolean {
  const value = record[key];

  if (typeof value !== "boolean") {
    throw new Error(`${label} field '${key}' must be a boolean.`);
  }

  return value;
}

function assertBoolean(record: JsonRecord, key: string, label: string): void {
  readBoolean(record, key, label);
}

function assertFiniteNumber(value: unknown, message: string): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(message);
  }
}

function assertEquals<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message} Expected ${String(expected)}, received ${String(actual)}.`);
  }
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
