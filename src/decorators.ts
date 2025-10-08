import { v4 as uuid } from "uuid"

export function encrichItemWithId(generateId: () => string = uuid) {
  return (targetClass: any, methodName: string, arg: any) => {
    console.log(targetClass[methodName], arg, generateId)
    // targetClass[methodName](...arg.value())
  }
}
