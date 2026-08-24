export type StudyRoomActionState = {
  kind: 'idle' | 'error' | 'success'
  message: string
}

export const initialStudyRoomActionState: StudyRoomActionState = {
  kind: 'idle',
  message: '',
}
