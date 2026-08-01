import { extname } from "node:path";
import { pathToFileURL } from "node:url";

const TYPESCRIPT_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts", ".mtsx", ".ctsx"]);

export interface LoadUserModuleOptions {
  /** Return the module's default export when present. */
  default?: boolean;
}

/** Load user-authored JavaScript or TypeScript from an absolute path. */
export async function loadUserModule(
  path: string,
  options: LoadUserModuleOptions = {},
): Promise<unknown> {
  if (TYPESCRIPT_EXTENSIONS.has(extname(path))) {
    const { createJiti } = await import("jiti");
    const jiti = createJiti(import.meta.url, { interopDefault: options.default ?? false });
    return options.default ? jiti.import(path, { default: true }) : jiti.import(path);
  }

  const mod = (await import(pathToFileURL(path).href)) as { default?: unknown };
  return options.default ? (mod.default ?? mod) : mod;
}
