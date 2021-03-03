// src/__mocks__/webextension-polyfill-ts
// Update this file to include any mocks for the `webextension-polyfill-ts` package
// This is used to mock these values for Storybook so you can develop your components
// outside the Web Extension environment provided by a compatible browser

let _localData = {}
let _syncData = {}

export const browser: any = {
  storage: {
    sync: {
      get(): any {
        return _syncData
      },
      set(data: Record<string, unknown>): any {
        _syncData = data
        return data
      },
      clear(): void {
        _syncData = {}
      }
    },
    local: {
      get(): any {
        return _localData
      },
      set(data: Record<string, unknown>): any {
        _localData = data
        return data
      },
      clear(): void {
        _localData = {}
      }
    }
  }
}
