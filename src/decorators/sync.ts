import { Data } from "../index.d"

import StorageManager from "../StorageManager"

export function sync() {
  return function (
    target: StorageManager,
    _propertyKey: string,
    descriptor?: PropertyDescriptor
  ): void {
    if (!descriptor) return

    const orig = descriptor.value

    descriptor.value = function (
      this: StorageManager,
      currentData: Data,
      ...args: any[]
    ) {
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
