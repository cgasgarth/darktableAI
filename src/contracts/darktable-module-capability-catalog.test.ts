import { describe, expect, test } from "bun:test";

import { listAdjustmentCapabilities } from "./adjustment-capability";
import {
  AUDITED_DARKTABLE_IOP_MODULES,
  listAuditedDarktableIopModules
} from "./darktable-iop-audited-inventory";
import { listDarktableNativeCapabilities } from "./darktable-native-capability";
import {
  listDarktableModuleCapabilityCatalog,
  type DarktableCatalogModule
} from "./darktable-module-capability-catalog";

describe("darktable module capability catalog", () => {
  test("covers every audited darktable src/iop/*.c module exactly once", () => {
    const catalog = listDarktableModuleCapabilityCatalog();

    expect(Object.keys(catalog).filter((module): boolean => module !== "lens").sort()).toEqual(
      [...AUDITED_DARKTABLE_IOP_MODULES].sort()
    );

    for (const module of listAuditedDarktableIopModules()) {
      expect(catalog[module]).toBeDefined();
      expect(catalog[module].sourcePath).toBe(`darktable/src/iop/${module}.c`);
    }
  });

  test("keeps current recipe capability modules inside the catalog", () => {
    const catalog = listDarktableModuleCapabilityCatalog();
    const referencedModules = new Set<DarktableCatalogModule>(
      Object.values(listAdjustmentCapabilities())
        .map((capability): DarktableCatalogModule | null =>
          capability.darktableModule as DarktableCatalogModule | null
        )
        .filter((module): module is DarktableCatalogModule => module !== null)
    );

    expect([...referencedModules].sort()).toEqual([
      "colorbalancergb",
      "crop",
      "exposure",
      "rgblevels",
      "shadhi",
      "temperature"
    ]);

    for (const module of referencedModules) {
      expect(catalog[module]).toBeDefined();
      expect(catalog[module].status).not.toBe("excluded");
    }
  });

  test("keeps native capability registry modules and ids inside the catalog", () => {
    const catalog = listDarktableModuleCapabilityCatalog();

    for (const capability of Object.values(listDarktableNativeCapabilities())) {
      const module = capability.module as DarktableCatalogModule;

      expect(catalog[module]).toBeDefined();
      expect(catalog[module].nativeCapabilityIds).toContain(capability.id);
    }
  });

  test("marks audited helper and deprecated surfaces with explicit non-parity states", () => {
    const catalog = listDarktableModuleCapabilityCatalog();

    expect(catalog.mask_manager).toMatchObject({ status: "excluded", parameterBacklogStatus: "not-applicable" });
    expect(catalog.finalscale).toMatchObject({ status: "excluded", parameterBacklogStatus: "not-applicable" });
    expect(catalog.vibrance).toMatchObject({ status: "legacy", parameterBacklogStatus: "not-applicable" });
    expect(catalog.retouch).toMatchObject({ status: "fork-required", parameterBacklogStatus: "blocked" });
  });
});
