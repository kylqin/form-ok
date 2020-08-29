import { WidgetMap, WidgetOptionsT } from '../widget-map'
import { DefaultReadonlyWidget, BaseWidget } from './base-widget-f'

/** 注册 widget */
export function registerWidget (name: string, widgetOptions: WidgetOptionsT|BaseWidget) {
  WidgetMap[name] = ((widgetOptions as WidgetOptionsT).widget ? widgetOptions : { widget: widgetOptions }) as WidgetOptionsT

  if (!WidgetMap[name].readonly) {
    // 如果没有设置 readonly widget, 使用默认的 readonly
    WidgetMap[name].readonly = DefaultReadonlyWidget
  }
}

export function registerWidgets (mapping: { [widget: string]: WidgetOptionsT|BaseWidget }) {
  Object.keys(mapping).forEach(name => {
    registerWidget(
      name,
      mapping[name]
    )
  })
}

export function registerWidgetExtends (superWidgetName: string, name: string, widgetOptions: WidgetOptionsT) {
  registerWidget(name, mergeObjects(
    WidgetMap[superWidgetName],
    widgetOptions,
    ['widget', 'readonly', 'valueParser']
  ))
}

function mergeObjects (ob1: any, ob2: any, atomKeys = []): any {
  const result = { root: null }
  const walk = (dst, src, base, key) => {
    if (atomKeys.includes(key)) {
      dst[key] = src
      return dst
    }

    if (src !== null && typeof src === 'object') {
      dst[key] = []
      if (base !== null && typeof base === 'object') {
        Object.keys(base).forEach(k => {
          walk(dst[key], base[k], null, k)
        })

        Object.keys(src).forEach(k => {
          walk(dst[key], src[k], base[k], k)
        })
      } else {
        Object.keys(src).forEach(k => {
          walk(dst[key], src[k], null, k)
        })
      }
    } else {
      dst[key] = src
    }
    return dst
  }

  walk(result, ob2, ob1, 'root')

  return result.root
}