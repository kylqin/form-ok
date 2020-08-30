import { BaseWidget } from './base-widget'
import { ValueParserT } from '/@/core/types'
import { PlainObject } from '/@/core/utils'

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