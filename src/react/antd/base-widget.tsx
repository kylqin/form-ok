import React from 'react'
import { FormCommonPropsExtT } from './input-set'
import { WidgetMap } from './widget-map'
import { FieldPropsT } from '/@/core/types'

export type FieldPropsBaseT = Omit<FieldPropsT, 'syncFieldValue|markNeedSyncValue|clone'> & { commonProps: FormCommonPropsExtT }

export type BaseWidget = (props: FieldPropsBaseT) => JSX.Element

export function getWidgetOptions (props: FieldPropsBaseT) { return WidgetMap[props.widget] }

/** 解析向外的 value, toData */
function parseValueOut (props: FieldPropsBaseT, value: any) {
  const { widget } = props
  // 必要是，对 value 进行相应的 parse
  const vp = WidgetMap[widget].valueParser
  if (vp && vp.toData) {
    return vp.toData(value, props)
  }
  return value
}

/** 解析进来的 value */
function parseValueIn (props: FieldPropsBaseT, value: any) {
  const { widget, commonProps: { Form } } = props

  // 解析进来的 value
  const vp = WidgetMap[widget].valueParser
  if (vp && vp.toWidget) {
    return vp.toWidget(value, props)
  }
  return value
}

/**
 * 值改变回调
 * @param {Event|any} valueOrEvent 事件对象或新值
 */
function handleChange (props: FieldPropsBaseT, valueOrEvent: Event|any, text?: string) {
  const { path, labelPath, commonProps: { Form } } = props
  let value = valueOrEvent && valueOrEvent.target
    ? valueOrEvent.target.value
    : valueOrEvent

  value = parseValueOut(props, value)
  if (labelPath) {
    text = parseValueOut(props, text)
    Form.actions.changeFields({
      [path!]: value,
      [labelPath]: text
    })
  } else {
    Form.actions.changeField(path!, value)
  }
}

/**
 * blur 回调
 * @param {Event|any} valueOrEvent 事件对象或新值
 */
function handleBlur (props: FieldPropsBaseT, valueOrEvent: Event|any) {
  const { onBlur, value, text, commonProps: { Form } } = props
  onBlur && onBlur(value, text, Form)
}

export function getValue (props: FieldPropsBaseT) {
  const { value } = props
  // const { value } = this.state
  return parseValueIn(props, value === '' || value === null ? undefined : value)
}

export function getProps (props: FieldPropsBaseT) {
  const { commonProps, attrs, path, readonly: readOnly, ...rest } = props
  return { ...rest, readOnly }
}

export function getAttrs (props: FieldPropsBaseT) {
  const { attrs, widget } = props
  if (attrs) {
    return { ...WidgetMap[widget].attrs || {}, ...attrs }
  } else {
    return WidgetMap[widget].attrs || {}
  }
}

/** 获取 Input 属性 */
export function getInputProps (props: FieldPropsBaseT) {
  const { disabled } = props
  const value = getValue(props)
  const inputPros = {
    className: 'fok-form-item-input-control',
    value,
    disabled,
    onChange: handleChange.bind(null, props),
    onBlur: handleBlur.bind(null, props)
  }

  return inputPros
}

export function DefaultReadonlyWidget (props: FieldPropsBaseT) {
  let value = getValue(props)
  if (Array.isArray(value)) {
    value = value.join(';')
  }
  if (value && typeof value === 'object') {
    value = JSON.stringify(value)
  }
  value = value || ''
  return <div className='fok-form-item-control-readonly'>{value}</div>
}