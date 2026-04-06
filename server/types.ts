export interface RelayCommand {
  id: string
  tool: string
  params: Record<string, unknown>
}

export interface RelayResponse {
  id: string
  success: boolean
  data?: unknown
  error?: string
}
