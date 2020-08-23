import { PlainObject } from './types'

export class EventBus {
  private eventTarget = new EventTarget()

  add (type: string, listener: () => void, options?: any) {
    this.eventTarget.addEventListener(type, listener)
  }

  remove (type: string, listener: () => void) {
    this.eventTarget.removeEventListener(type, listener)
  }

  dispatch (type: string, event: PlainObject) {
    this.eventTarget.dispatchEvent(new Event(type, event))
  }
}