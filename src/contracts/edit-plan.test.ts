import { describe, expect, test } from "bun:test";

import {
  StrictEditPlanValidator,
  type EditPlan
} from "./edit-plan";

describe("StrictEditPlanValidator", () => {
  test("rejects plans without operations", (): void => {
    const validator = new StrictEditPlanValidator();
    const plan: EditPlan = {
      planId: "plan-empty",
      sourceAssetPath: "../DSC00075.ARW",
      operations: []
    };

    const issues = validator.validate(plan);

    expect(issues).toEqual([
      {
        code: "EMPTY_OPERATIONS",
        message: "Edit plans must declare at least one operation."
      }
    ]);
  });

  test("rejects duplicate operation kinds", (): void => {
    const validator = new StrictEditPlanValidator();
    const plan: EditPlan = {
      planId: "plan-duplicate",
      sourceAssetPath: "../DSC00075.ARW",
      operations: [
        {
          kind: "exposure",
          exposureCompensation: 0.5
        },
        {
          kind: "exposure",
          exposureCompensation: 1
        }
      ]
    };

    const issues = validator.validate(plan);

    expect(issues).toEqual([
      {
        code: "DUPLICATE_OPERATION_KIND",
        message: "Edit plans cannot repeat the 'exposure' operation kind."
      }
    ]);
  });

  test("accepts a plan with unique operations", (): void => {
    const validator = new StrictEditPlanValidator();
    const plan: EditPlan = {
      planId: "plan-valid",
      sourceAssetPath: "../DSC00075.ARW",
      operations: [
        {
          kind: "exposure",
          exposureCompensation: 0.25
        },
        {
          kind: "white-balance",
          temperatureKelvin: 5600,
          tintCompensation: 0
        }
      ]
    };

    const issues = validator.validate(plan);

    expect(issues).toEqual([]);
  });
});
