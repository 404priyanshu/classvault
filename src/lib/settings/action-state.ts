export type SettingsActionState = {
  kind: 'error' | 'idle' | 'success'
  message: string
}

export const initialSettingsActionState: SettingsActionState = {
  kind: 'idle',
  message: '',
}
