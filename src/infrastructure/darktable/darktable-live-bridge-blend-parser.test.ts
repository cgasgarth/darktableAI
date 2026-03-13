import { describe, expect, test } from "bun:test";

import { DarktableLiveBridgeBlendParser } from "./darktable-live-bridge-blend-parser";

describe("DarktableLiveBridgeBlendParser", (): void => {
  test("parses module blend mutation payloads with only changed fields", (): void => {
    const parser = new DarktableLiveBridgeBlendParser();

    expect(
      parser.parseMutation({
        targetInstanceKey: "colorbalancergb#7#1#",
        moduleOp: "colorbalancergb",
        iopOrder: 18,
        multiPriority: 1,
        multiName: "mask",
        previousBlendMode: "normal",
        requestedBlendMode: "multiply",
        currentBlendMode: "multiply",
        previousReverseOrder: false,
        requestedReverseOrder: true,
        currentReverseOrder: true,
        historyBefore: 4,
        historyAfter: 5,
        requestedHistoryEnd: 5
      })
    ).toEqual({
      targetInstanceKey: "colorbalancergb#7#1#",
      moduleOp: "colorbalancergb",
      iopOrder: 18,
      multiPriority: 1,
      multiName: "mask",
      previousBlendMode: "normal",
      requestedBlendMode: "multiply",
      currentBlendMode: "multiply",
      previousReverseOrder: false,
      requestedReverseOrder: true,
      currentReverseOrder: true,
      historyBefore: 4,
      historyAfter: 5,
      requestedHistoryEnd: 5
    });
  });

  test("parses unavailable module blend payloads with requested blend mode", (): void => {
    const parser = new DarktableLiveBridgeBlendParser();

    expect(
      parser.parseUnavailable({
        targetInstanceKey: "colorbalancergb#7#1#",
        requestedBlendMode: "softlight"
      })
    ).toEqual({
      targetInstanceKey: "colorbalancergb#7#1#",
      requestedBlendMode: "softlight"
    });
  });
});
