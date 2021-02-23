import { Data } from "../index.d"

import StorageManager from "@src/StorageManager"

export function sync() {
  return function (
    target: StorageManager,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    console.log({ descriptor })

    let method = descriptor.value;
    descriptor.value = function () {
      console.log("Do something")
    }
    return method.apply(this, arguments);
  };

    return function (data: Data, ...methodArgs: any[]) {
      if (target.interactingWithDB) {
        this.syncQueue.push((newData: Data) =>
          descriptor.value(newData, ...methodArgs)
        )
        console.log("BUSY!", target.syncQueue)
        return data
      } else {
        console.log("calling function", { target })
        return descriptor.value(data, ...methodArgs)
      }
    }.bind(target)
  }
}
