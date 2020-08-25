import { PlainObject, ValueParserT } from '/@/core/types'
import { BaseWidget } from './widgets/base-widget'

export type WidgetOptionsT = {
  widget: typeof BaseWidget
  readonly?: typeof BaseWidget
  valueParser?: ValueParserT
  attrs?: PlainObject
  modify?: PlainObject
  notField?: boolean
  noWrapper?: boolean
}

export type WidgetMapT = { [wiget: string]: WidgetOptionsT }

/**
 * WidgetMap
 */
export const WidgetMap: WidgetMapT = {}