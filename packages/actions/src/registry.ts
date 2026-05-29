import type { ActionDefinition } from "@next-ai-ready/core";

/**
 * Type-erased action — the storage type used everywhere we no longer have
 * the user's input/output generics in scope. `unknown` is wrong here because
 * the handler is contravariant in its input parameter; `any` is the only
 * sound erasure that lets `ActionDefinition<X, Y>` widen on insertion.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyAction = ActionDefinition<any, any>;

/**
 * Process-global action registry.
 *
 * The user's `actions/index.ts` is imported once per process (by the build
 * CLI at build time, and by each `/api/actions/<name>` route at runtime).
 * It calls `registerActions(...)` to populate this singleton.
 *
 * We do NOT auto-register from `defineAction` itself — that would couple
 * authoring to a singleton and break tree-shaking. Authors collect their
 * actions into an array and pass them here exactly once.
 */
const registry = new Map<string, AnyAction>();

export function registerActions(actions: ReadonlyArray<AnyAction>): void {
  for (const action of actions) {
    if (registry.has(action.name)) {
      throw new Error(`[next-ai-ready] Duplicate action name: "${action.name}"`);
    }
    registry.set(action.name, action);
  }
}

export function getAction(name: string): AnyAction | undefined {
  return registry.get(name);
}

export function listActions(): AnyAction[] {
  return [...registry.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function clearRegistry(): void {
  registry.clear();
}

/**
 * Convenience for users: `defineActions([...])` registers and returns the
 * array, so the same module can be both imported for side-effects (runtime)
 * and inspected (build CLI dynamic import).
 */
export function defineActions<A extends ReadonlyArray<AnyAction>>(actions: A): A {
  registerActions(actions);
  return actions;
}
