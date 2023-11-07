import { Data } from "../index.d"

import StorageManager from "../StorageManager"

export function sync() {
  return function (
    target: StorageManager,
    propertyKey: string,
    descriptor?: PropertyDescriptor
  ): void {
    const orig = descriptor.value

    descriptor.value = function (currentData: Data, ...args: any[]) {
      if (target.busy) {
        this.syncQueue.push((newData: Data) =>
          orig.call(target, newData, ...args)
        )
        return currentData
      }

      return orig.call(target, currentData, ...args)
    }
  }
}
