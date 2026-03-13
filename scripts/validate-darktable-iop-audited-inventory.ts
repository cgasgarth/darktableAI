import { existsSync } from "node:fs";
import path from "node:path";

import {
  AUDITED_DARKTABLE_IOP_MODULES,
  type AuditedDarktableIopModule
} from "../src/contracts/darktable-iop-audited-inventory";

const siblingIopDirectory = path.resolve(import.meta.dir, "../../darktable/src/iop");

if (!existsSync(siblingIopDirectory)) {
  console.log(JSON.stringify({ checked: false, reason: `Missing sibling checkout at ${siblingIopDirectory}` }));
  process.exit(0);
}

const discoveredModules = (await Array.fromAsync(new Bun.Glob("*.c").scan({ cwd: siblingIopDirectory })))
  .map((fileName): AuditedDarktableIopModule => fileName.replace(/\.c$/u, "") as AuditedDarktableIopModule)
  .sort();
const auditedModules = [...AUDITED_DARKTABLE_IOP_MODULES].sort();
const missingFromAudit = discoveredModules.filter((module): boolean => !auditedModules.includes(module));
const missingFromSibling = auditedModules.filter((module): boolean => !discoveredModules.includes(module));

if (missingFromAudit.length > 0 || missingFromSibling.length > 0) {
  console.log(
    JSON.stringify({ checked: true, ok: false, siblingIopDirectory, missingFromAudit, missingFromSibling })
  );
  process.exit(1);
}

console.log(JSON.stringify({ checked: true, ok: true, siblingIopDirectory, moduleCount: auditedModules.length }));
