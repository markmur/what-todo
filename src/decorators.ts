import { v4 as uuid } from "uuid"

export function encrichItemWithId(generateId = uuid()) {
  return (targetClass, methodName, arg) => {
    console.log(targetClass[methodName], arg)
    // targetClass[methodName](...arg.value())
  }
}
