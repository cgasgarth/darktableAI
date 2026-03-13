import type { DevelopRecipe } from "../../contracts/develop-recipe";
import type { DevelopRecipeValidationIssue } from "../../contracts/develop-recipe";

export interface DevelopRecipeValidator {
  validate(recipe: DevelopRecipe): ReadonlyArray<DevelopRecipeValidationIssue>;
}
