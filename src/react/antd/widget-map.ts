import { PlainObject, ValueParserT } from '/@/core/types'
import { BaseWidget } from './widgets/base-widget-f'

export type WidgetOptionsT = {
  widget: BaseWidget
  readonly?: BaseWidget
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