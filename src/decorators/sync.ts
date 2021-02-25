import { Data } from "../index.d"

import StorageManager from "@src/StorageManager"

export function sync() {
  return function (
    target: StorageManager,
    propertyKey: string,
    descriptor?: PropertyDescriptor
  ) {
    console.log("target", target)
    let orig = descriptor.value

    descriptor.value = function (...args: any[]) {
      console.log(target, target.interactingWithDB)
      if (target.interactingWithDB) {
        this.syncQueue.push((newData: Data) =>
          orig.apply(target, newData, args)
        )
        console.log("BUSY!", target.syncQueue)
        return null
      } else {
        console.log("calling function", { target })
        return orig.apply(target, args)
      }
    }
  }
}
