/// <reference types="vite/client" />

declare module "@meronex/icons/*" {
  import { ComponentType } from "react"
  const Icon: ComponentType<Record<string, unknown>>
  export default Icon
}
