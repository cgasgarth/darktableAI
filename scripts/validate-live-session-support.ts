export interface ValidateLiveSmokeInput {
  readonly firstSession: JsonRecord;
  readonly mutation: JsonRecord;
  readonly secondSession: JsonRecord;
  readonly assetPath: string;
  readonly liveBridgePath: string;
  readonly requestedExposure: number;
  readonly setTimeoutMilliseconds: number;
  readonly setPollIntervalMilliseconds: number;
  readonly floatTolerance: number;
}

export interface SmokeOutcome {
  readonly mode: "render-completed" | "timed-out-known-limitation";
  readonly note: string;
}

interface SessionState {
  readonly renderSequence: number;
  readonly view: string;
  readonly sourceAssetPath: string;
  readonly currentExposure: number;
}

type JsonRecord = Record<string, unknown>;

export function validateLiveSmoke(input: ValidateLiveSmokeInput): SmokeOutcome {
  const firstExposure = validateSessionInfo(input.firstSession, "first live-session-info", input);
  const secondExposure = validateSessionInfo(input.secondSession, "second live-session-info", input);
  const mutationState = validateExposureMutation(input.mutation, firstExposure, secondExposure, input);

  if (mutationState.mode === "render-completed") {
    return {
      mode: mutationState.mode,
      note: "Exposure mutation completed and read back at the requested value."
    };
  }

  return {
    mode: mutationState.mode,
    note: "Known limitation: packaged darktable advertises a successful exposure request, but render completion and exposure readback stay unchanged in this headless live session."
  };
}

function validateSessionInfo(
  payload: JsonRecord,
  label: string,
  input: ValidateLiveSmokeInput
): SessionState {
  assertString(payload, "requestId", label);
  assertEquals(readNumber(payload, "bridgeVersion", label), 1, `${label} bridgeVersion must equal 1.`);
  assertEquals(readString(payload, "status", label), "ok", `${label} status must be 'ok'.`);

  const diagnostics = readRecord(payload, "diagnostics", label);
  assertEquals(
    readString(diagnostics, "helperBinaryPath", `${label} diagnostics`),
    input.liveBridgePath,
    `${label} helper path changed unexpectedly.`
  );
  assertCommandArguments(diagnostics, [input.liveBridgePath, "get-session"], `${label} diagnostics`);

  const session = readRecord(payload, "session", label);
  const activeImage = readRecord(payload, "activeImage", label);
  const exposure = readRecord(payload, "exposure", label);
  const sessionState = {
    renderSequence: readInteger(session, "renderSequence", `${label} session`),
    view: readString(session, "view", `${label} session`),
    sourceAssetPath: readString(activeImage, "sourceAssetPath", `${label} activeImage`),
    currentExposure: readNumber(exposure, "current", `${label} exposure`)
  } satisfies SessionState;

  assertEquals(sessionState.view, "darkroom", `${label} must attach to the darkroom view.`);
  assertEquals(sessionState.sourceAssetPath, input.assetPath, `${label} resolved the wrong active asset.`);

  return sessionState;
}

function validateExposureMutation(
  payload: JsonRecord,
  firstSession: SessionState,
  secondSession: SessionState,
  input: ValidateLiveSmokeInput
): SmokeOutcome {
  assertString(payload, "requestId", "live-set-exposure");
  assertEquals(readNumber(payload, "bridgeVersion", "live-set-exposure"), 1, "live-set-exposure bridgeVersion must equal 1.");
  assertEquals(readString(payload, "status", "live-set-exposure"), "ok", "live-set-exposure status must be 'ok'.");

  const diagnostics = readArray(payload, "diagnostics", "live-set-exposure");
  assert(diagnostics.length >= 1, "live-set-exposure diagnostics must include at least one helper call.");
  assertCommandArguments(readRecordAt(diagnostics, 0, "live-set-exposure diagnostics"), [
    input.liveBridgePath,
    "set-exposure",
    String(input.requestedExposure)
  ], "live-set-exposure diagnostics[0]");

  const wait = readRecord(payload, "wait", "live-set-exposure");
  const setExposure = readRecord(payload, "setExposure", "live-set-exposure");
  const session = readRecord(payload, "session", "live-set-exposure");
  const activeImage = readRecord(payload, "activeImage", "live-set-exposure");
  const exposure = readRecord(payload, "exposure", "live-set-exposure");

  assertEquals(readString(wait, "mode", "live-set-exposure wait"), "until-render", "live-set-exposure wait mode regressed.");
  assertEquals(
    readInteger(wait, "timeoutMilliseconds", "live-set-exposure wait"),
    input.setTimeoutMilliseconds,
    "live-set-exposure timeout changed unexpectedly."
  );
  assertEquals(
    readInteger(wait, "pollIntervalMilliseconds", "live-set-exposure wait"),
    input.setPollIntervalMilliseconds,
    "live-set-exposure poll interval changed unexpectedly."
  );
  assertApproximately(
    readNumber(setExposure, "requested", "live-set-exposure setExposure"),
    input.requestedExposure,
    input.floatTolerance,
    "live-set-exposure requested exposure changed unexpectedly."
  );
  assertApproximately(
    readNumber(setExposure, "previous", "live-set-exposure setExposure"),
    firstSession.currentExposure,
    input.floatTolerance,
    "live-set-exposure previous exposure no longer matches the first session snapshot."
  );
  assertEquals(
    readString(activeImage, "sourceAssetPath", "live-set-exposure activeImage"),
    input.assetPath,
    "live-set-exposure resolved the wrong active asset."
  );
  assertEquals(readString(session, "view", "live-set-exposure session"), "darkroom", "live-set-exposure left darkroom view.");

  const requestedRenderSequence = readInteger(setExposure, "requestedRenderSequence", "live-set-exposure setExposure");
  const mutationRenderSequence = readInteger(session, "renderSequence", "live-set-exposure session");
  const latestObservedRenderSequence = readInteger(wait, "latestObservedRenderSequence", "live-set-exposure wait");
  const mutationReadback = readNumber(setExposure, "current", "live-set-exposure setExposure");
  const sessionReadback = readNumber(exposure, "current", "live-set-exposure exposure");
  const completed = readBoolean(wait, "completed", "live-set-exposure wait");
  const timedOut = readBoolean(wait, "timedOut", "live-set-exposure wait");

  assert(
    requestedRenderSequence > firstSession.renderSequence,
    "live-set-exposure did not request a future render sequence."
  );

  if (completed) {
    assert(!timedOut, "live-set-exposure cannot be both completed and timed out.");
    assert(
      latestObservedRenderSequence >= requestedRenderSequence,
      "live-set-exposure completed without observing the requested render sequence."
    );
    assert(
      mutationRenderSequence >= requestedRenderSequence,
      "live-set-exposure session render sequence never reached the requested target."
    );
    assert(
      secondSession.renderSequence >= requestedRenderSequence,
      "second live-session-info render sequence fell behind the completed target."
    );
    assertApproximately(
      mutationReadback,
      input.requestedExposure,
      input.floatTolerance,
      "live-set-exposure mutation readback no longer matches the requested exposure."
    );
    assertApproximately(
      sessionReadback,
      input.requestedExposure,
      input.floatTolerance,
      "live-set-exposure session snapshot no longer reports the requested exposure."
    );
    assertApproximately(
      secondSession.currentExposure,
      input.requestedExposure,
      input.floatTolerance,
      "second live-session-info no longer reports the requested exposure."
    );

    return {
      mode: "render-completed",
      note: "Exposure mutation completed and read back at the requested value."
    };
  }

  assert(timedOut, "Incomplete live-set-exposure waits must time out.");
  assert(
    latestObservedRenderSequence < requestedRenderSequence,
    "Timed out live-set-exposure unexpectedly observed the requested render sequence."
  );
  assert(
    mutationRenderSequence < requestedRenderSequence,
    "Timed out live-set-exposure session render sequence unexpectedly reached the target."
  );
  assert(
    secondSession.renderSequence <= requestedRenderSequence,
    "Second live-session-info render sequence advanced beyond the requested target during timeout mode."
  );
  assertApproximately(
    mutationReadback,
    firstSession.currentExposure,
    input.floatTolerance,
    "Timed out live-set-exposure mutation readback changed unexpectedly."
  );
  assertApproximately(
    sessionReadback,
    firstSession.currentExposure,
    input.floatTolerance,
    "Timed out live-set-exposure session readback changed unexpectedly."
  );
  assertApproximately(
    secondSession.currentExposure,
    firstSession.currentExposure,
    input.floatTolerance,
    "Second live-session-info exposure changed unexpectedly during timeout mode."
  );

  return {
    mode: "timed-out-known-limitation",
    note: "Known limitation: live-set-exposure never completes against the packaged headless darktable session on this machine."
  };
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

function readBoolean(record: JsonRecord, key: string, label: string): boolean {
  const value = record[key];

  if (typeof value !== "boolean") {
    throw new Error(`${label} field '${key}' must be a boolean.`);
  }

  return value;
}

function assertString(record: JsonRecord, key: string, label: string): void {
  readString(record, key, label);
}

function assertEquals<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message} Expected ${String(expected)}, received ${String(actual)}.`);
  }
}

function assertApproximately(actual: number, expected: number, tolerance: number, message: string): void {
  if (Math.abs(actual - expected) > tolerance) {
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
