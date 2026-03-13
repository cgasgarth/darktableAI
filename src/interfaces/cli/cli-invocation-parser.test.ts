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

  test("rejects extra args for capabilities command", () => {
    const parser = new StrictCliInvocationParser();

    expect(() => parser.parse(["capabilities", "unexpected"])).toThrow(
      "Command 'capabilities' does not accept additional arguments."
    );
  });
});
