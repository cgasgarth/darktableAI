import type { CompiledDevelopRecipe } from "../models/render-artifacts";
import type { DevelopRecipe } from "../../contracts/develop-recipe";

export interface DevelopRecipeCompiler {
  compile(recipe: DevelopRecipe): Promise<CompiledDevelopRecipe>;
}
