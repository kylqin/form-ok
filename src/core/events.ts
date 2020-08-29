import { PlainObject } from './types'

export type Listener = () => void

export class EventBus {
  private eventTarget = new EventTarget()

  add (type: string, listener: Listener, options?: any) {
    this.eventTarget.addEventListener(type, listener)
  }

  remove (type: string, listener: Listener) {
    this.eventTarget.removeEventListener(type, listener)
  }

  dispatch (type: string, event: PlainObject) {
    this.eventTarget.dispatchEvent(new Event(type, event))
  }

  listenValueUpdate (path: string, listener: Listener) {
    this.eventTarget.addEventListener(`${path}:value`, listener)
    return () => {
      this.eventTarget.removeEventListener(`${path}:value`, listener)
    }
  }

  dispatchValueUpdate (path: string) {
    this.eventTarget.dispatchEvent(new Event(`${path}:value`, {}))
  }

  listenPropsUpdate (path: string, listener: Listener) {
    this.eventTarget.addEventListener(`${path}:props`, listener)
    return () => {
      this.eventTarget.removeEventListener(`${path}:props`, listener)
    }
  }

  dispatchPropsUpdate (path: string) {
    this.eventTarget.dispatchEvent(new Event(`${path}:props`, {}))
  }
}
