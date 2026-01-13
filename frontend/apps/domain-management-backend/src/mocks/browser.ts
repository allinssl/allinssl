import { setupWorker } from 'msw/browser'
import { rechargeHandlers } from './handlers/recharge'

export const worker = setupWorker(...rechargeHandlers)

export const startMock = async () => {
  if (typeof window === 'undefined') return
  if ((window as any).__MSW_STARTED__) return
  await worker.start({ onUnhandledRequest: 'bypass' })
  ;(window as any).__MSW_STARTED__ = true
} 