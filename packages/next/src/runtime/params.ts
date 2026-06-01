/**
 * Resolve Next.js route `params` — supports sync (Next 14) and Promise (Next 15+).
 */
export async function resolveParams<T>(params: Promise<T> | T): Promise<T> {
  return Promise.resolve(params);
}
