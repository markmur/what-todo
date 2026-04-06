/// <reference types="vite/client" />

declare const __APP_VERSION__: string

declare module "@meronex/icons/*" {
  import { ComponentType } from "react"
  const Icon: ComponentType<Record<string, unknown>>
  export default Icon
}
