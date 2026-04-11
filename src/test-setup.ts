/**
 * Vitest setup file.
 *
 * happy-dom exposes localStorage on its Window object, but vitest
 * does not always copy it to the global scope. This shim ensures a
 * working localStorage is available in every test.
 */

if (
  typeof globalThis.localStorage === "undefined" ||
  typeof globalThis.localStorage.clear !== "function"
) {
  const store = new Map<string, string>()

  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    get length() {
      return store.size
    },
    key: (index: number) => [...store.keys()][index] ?? null
  } as Storage
}
