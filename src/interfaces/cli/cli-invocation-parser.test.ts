import { describe, expect, test } from "bun:test";

import { StrictCliInvocationParser } from "./cli-invocation-parser";

describe("StrictCliInvocationParser", () => {
  test("returns help when no args are provided", () => {
    const parser = new StrictCliInvocationParser();

    expect(parser.parse([])).toEqual({ kind: "help" });
  });

  test("parses smoke command with explicit fixture", () => {
    const parser = new StrictCliInvocationParser();

    expect(parser.parse(["smoke", "--fixture", "sample-fixture"])).toEqual({
      kind: "smoke",
      fixtureId: "sample-fixture"
    });
  });

  test("parses render-preview command with recipe file path", () => {
    const parser = new StrictCliInvocationParser();
    const invocation = parser.parse(["render-preview", "--recipe-file", "examples/recipe.json"]);

    expect(invocation.kind).toBe("render-preview");

    if (invocation.kind !== "render-preview") {
      throw new Error("Expected render-preview invocation.");
    }

    expect(invocation.recipeFilePath.endsWith("examples/recipe.json")).toBeTrue();
  });

  test("parses capabilities command with no arguments", () => {
    const parser = new StrictCliInvocationParser();

    expect(parser.parse(["capabilities"])).toEqual({ kind: "capabilities" });
  });

  test("parses live-session-info command with no arguments", () => {
    const parser = new StrictCliInvocationParser();

    expect(parser.parse(["live-session-info"])).toEqual({ kind: "live-session-info" });
  });

  test("parses live-session-snapshot command with no arguments", () => {
    const parser = new StrictCliInvocationParser();

    expect(parser.parse(["live-session-snapshot"])).toEqual({ kind: "live-session-snapshot" });
  });

  test("parses live-set-exposure without polling", () => {
    const parser = new StrictCliInvocationParser();

    expect(parser.parse(["live-set-exposure", "--exposure", "0.75"])).toEqual({
      kind: "live-set-exposure",
      exposure: 0.75,
      wait: {
        mode: "none"
      }
    });
  });

  test("parses live-set-exposure with explicit polling policy", () => {
    const parser = new StrictCliInvocationParser();

    expect(
      parser.parse([
        "live-set-exposure",
        "--exposure",
        "1.25",
        "--timeout-ms",
        "1500",
        "--poll-interval-ms",
        "100"
      ])
    ).toEqual({
      kind: "live-set-exposure",
      exposure: 1.25,
      wait: {
        mode: "until-render",
        timeoutMilliseconds: 1500,
        pollIntervalMilliseconds: 100
      }
    });
  });

  test("rejects extra args for capabilities command", () => {
    const parser = new StrictCliInvocationParser();

    expect(() => parser.parse(["capabilities", "unexpected"])).toThrow(
      "Command 'capabilities' does not accept additional arguments."
    );
  });

  test("rejects partial live-set-exposure wait configuration", () => {
    const parser = new StrictCliInvocationParser();

    expect(() =>
      parser.parse(["live-set-exposure", "--exposure", "0.25", "--timeout-ms", "1000"])
    ).toThrow(
      "Command 'live-set-exposure' requires both '--timeout-ms' and '--poll-interval-ms' when waiting for render completion."
    );
  });
});
