import React from 'react'
import { FormCommonPropsExtT } from '../input-set'
import { WidgetMap } from '../widget-map'
import { FieldPropsT } from '/@/core/types'

export type FieldPropsBaseT = Omit<FieldPropsT, 'syncFieldValue|markNeedSyncValue|clone'> & { commonProps: FormCommonPropsExtT }

/** InputSet Controller Base Component */
export class BaseWidget extends React.Component<FieldPropsBaseT> {
  private _handleChange
  private _handleBlur
  private _handleFocus

  /** 初始值设置为 true, 可以避免 `首次输入时 控件 value 变为 ''` 的bug */
  /** 原因: 如果 _focused 初始值为 false, 首次 focus 时会引起 value 的跳变 */
  private _focused = true

  constructor (props) {
    super(props)

    console.log('BW constructor >>>>', props.path)
    this._handleChange = this.handleChange.bind(this)
    this._handleBlur = this.handleBlur.bind(this)
    this._handleFocus = this.handleFocus.bind(this)
  }

  getWidgetOptions () { return WidgetMap[this.props.widget] }

  /** 解析向外的 value, toData */
  parseValueOut (value: any) {
    const { widget } = this.props
    // 必要是，对 value 进行相应的 parse
    const vp = WidgetMap[widget].valueParser
    if (vp && vp.toData) {
      return vp.toData(value, this.props)
    }
    return value
  }

  parseValueIn (value: any) {
    const { widget, commonProps: { formGroup } } = this.props

    // 解析进来的 value
    const vp = WidgetMap[widget].valueParser
    if (vp && vp.toWidget) {
      return vp.toWidget(value, this.props, formGroup.data)
    }
    return value
  }

  /**
   * 值改变回调
   * @param {Event|any} valueOrEvent 事件对象或新值
   */
  handleChange (valueOrEvent: Event|any, text?: string) {
    const { path, labelPath, commonProps: { formGroup } } = this.props
    let value = valueOrEvent && valueOrEvent.target
      ? valueOrEvent.target.value
      : valueOrEvent

    value = this.parseValueOut(value)
    if (labelPath) {
      text = this.parseValueOut(text)
      formGroup.actions.changeFields({
        [path!]: value,
        [labelPath]: text
      })
    } else {
      formGroup.actions.changeField(path!, value)
    }
  }

  /**
   * blur 回调
   * @param {Event|any} valueOrEvent 事件对象或新值
   */
  handleBlur (valueOrEvent: Event|any) {
    // blur 后，Input 变为受控组件，便于控件外部改变控件的值
    this._focused = false
    const { onBlur, value, text, commonProps: { formGroup } } = this.props
    onBlur && onBlur(value, text, formGroup)
  }

  /**
   * focus 回调， focus 后，Input 变为非受控组件
   * @param {Event} e
  */
 handleFocus (e: Event) {
  this._focused = true
  // this.props.onFocus && this.props.onFocus(e)
 }

  getValue () {
    const { value } = this.props
    // const { value } = this.state
    return this.parseValueIn(value === '' || value === null ? undefined : value)
  }

  getProps () {
    const { commonProps, attrs, path, readonly: readOnly, ...rest } = this.props
    return { ...rest, readOnly }
  }

  getAttrs () {
    const { attrs, widget } = this.props
    if (attrs) {
      return { ...WidgetMap[widget].attrs || {}, ...attrs }
    } else {
      return WidgetMap[widget].attrs || {}
    }
  }

  /** 获取 Input 属性 */
  getInputProps () {
    const { disabled } = this.props
    const value = this.getValue()
    const inputPros = {
      className: 'fok-form-item-input-control',
      value: this._focused ? undefined : value,
      defaultValue: value,
      disabled,
      onChange: this._handleChange,
      onBlur: this._handleBlur,
      onFocus: this._handleFocus
    }

    return inputPros
  }
}

export class DefaultReadonlyWidget extends BaseWidget {
  render () {
    let value = this.getValue()
    if (Array.isArray(value)) {
      value = value.join(';')
    }
    if (value && typeof value === 'object') {
      value = JSON.stringify(value)
    }
    value = value || ''
    return <div className='fok-form-item-control-readonly'>{value}</div>
  }
}