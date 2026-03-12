export interface EditPlan {
  readonly planId: string;
  readonly sourceAssetPath: string;
  readonly operations: ReadonlyArray<EditOperation>;
}

export type EditOperation = ExposureOperation | WhiteBalanceOperation;

export interface ExposureOperation {
  readonly kind: "exposure";
  readonly exposureCompensation: number;
}

export interface WhiteBalanceOperation {
  readonly kind: "white-balance";
  readonly temperatureKelvin: number;
  readonly tintCompensation: number;
}

export interface PlanValidationIssue {
  readonly code: "EMPTY_OPERATIONS" | "DUPLICATE_OPERATION_KIND";
  readonly message: string;
}

export interface EditPlanValidator {
  validate(plan: EditPlan): ReadonlyArray<PlanValidationIssue>;
}

export class StrictEditPlanValidator implements EditPlanValidator {
  public validate(plan: EditPlan): ReadonlyArray<PlanValidationIssue> {
    const issues: Array<PlanValidationIssue> = [];

    if (plan.operations.length === 0) {
      issues.push({
        code: "EMPTY_OPERATIONS",
        message: "Edit plans must declare at least one operation."
      });
    }

    const seenKinds = new Set<EditOperation["kind"]>();

    for (const operation of plan.operations) {
      if (seenKinds.has(operation.kind)) {
        issues.push({
          code: "DUPLICATE_OPERATION_KIND",
          message: `Edit plans cannot repeat the '${operation.kind}' operation kind.`
        });
      }

      seenKinds.add(operation.kind);
    }

    return issues;
  }
}
