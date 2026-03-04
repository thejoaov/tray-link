import { EmitterSubscription } from 'react-native'

import { DeviceEventEmitter } from '../modules/DeviceEventEmitter'

export type PendingProjectRemove = {
  id: string
  name: string
  path: string
  deleteFromDiskDefault: boolean
}

export type ConfirmProjectRemovePayload = {
  id: string
  path: string
  deleteFromDisk: boolean
}

const CONFIRM_PROJECT_REMOVE_EVENT = 'confirmProjectRemove'

let pendingProjectRemove: PendingProjectRemove | null = null

export const setPendingProjectRemove = (pending: PendingProjectRemove) => {
  pendingProjectRemove = pending
}

export const getPendingProjectRemove = () => pendingProjectRemove

export const clearPendingProjectRemove = () => {
  pendingProjectRemove = null
}

export const confirmPendingProjectRemove = (payload: ConfirmProjectRemovePayload) => {
  DeviceEventEmitter.emit(CONFIRM_PROJECT_REMOVE_EVENT, payload)
}

export const subscribeProjectRemoveConfirm = (
  listener: (payload: ConfirmProjectRemovePayload) => void,
): EmitterSubscription => {
  return DeviceEventEmitter.addListener(CONFIRM_PROJECT_REMOVE_EVENT, listener)
}
