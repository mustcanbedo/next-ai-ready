import { resolve } from "node:path";
import type { AiReadyConfig } from "@next-ai-ready/core";
import {
  clearRegistry,
  listActions,
  registerActions,
} from "@next-ai-ready/actions";
import { loadUserModule } from "./load-user-module.js";

type ConfiguredActions = NonNullable<AiReadyConfig["actions"]>;

/** Populate the process-wide registry from inline actions or a user module. */
export async function loadConfiguredActions(cwd: string, actions: ConfiguredActions): Promise<void> {
  clearRegistry();
  if (Array.isArray(actions)) {
    registerActions(actions);
    return;
  }

  const mod = (await loadUserModule(resolve(cwd, actions))) as { default?: unknown };
  const defaultExport = mod?.default;
  if (Array.isArray(defaultExport) && listActions().length === 0) {
    registerActions(defaultExport);
  }
}
