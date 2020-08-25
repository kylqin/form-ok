import React from 'react'
import { FieldPropsT } from '/@/core/types'
import { WidgetMap } from '../widget-map'
import { FormCommonPropsExtT } from '../input-set'
import { useListenState } from '../../hooks'

export type FieldPropsBaseT = Omit<FieldPropsT, 'syncFieldValue|markNeedSyncValue|clone'> & { commonProps: FormCommonPropsExtT }

/** InputSet Controller Base Component */
export class BaseWidget extends React.Component<FieldPropsBaseT> {
  private _handleChange
  private _handleBlur

  private _removeListneners = () => {}

  constructor (props) {
    super(props)

    this.state = {
      value: props.value
    }

    console.log('BW constructor >>>>', props.path)
    this._handleChange = this.handleChange.bind(this)
    this._handleBlur = this.handleBlur.bind(this)
  }

  componentDidMount () {
    const { commonProps, path } = this.props
    // const newProps = commonProps.propsGetter!(commonProps.formGroup.field(path!)!)
    // console.log('BW componentDidMount', path, value, commonProps.formGroup.fields(null))
    this._removeListneners = useListenState(this, commonProps.formGroup, path!, 'value', commonProps.formGroup.field(path!)!.value)
  }

  componentWillUnmount () {
    // console.log('BW componentWillUnmount', this.props.path, this.props.value)
    // 去掉 useListenState
    this._removeListneners()
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { commonProps, path } = nextProps
    if (this.props.path !== nextProps.path) {
      // 去掉 useListenState
      this._removeListneners()
      this._removeListneners = useListenState(this, commonProps.formGroup, path!, 'value', commonProps.formGroup.field(path!)!.value)
    }

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
    const { onBlur, value, text, commonProps: { formGroup } } = this.props
    onBlur && onBlur(value, text, formGroup)
  }

  getValue () {
    // const { value } = this.props
    const { value } = this.state
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
    const inputPros = {
      className: 'fok-form-item-input-control',
      value: this.getValue(),
      disabled,
      onChange: this._handleChange,
      onBlur: this._handleBlur
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