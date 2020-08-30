import { QuestionCircleOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import React from 'react'
import { FormCommonPropsExtT } from './input-set'
import { FieldPropsT } from '/@/core/types'
import '/@/react/form-ok-react.scss'
import { useListenProps } from '/@/react/hooks'

export function FormItem (props: { field: FieldPropsT, commonProps: FormCommonPropsExtT, children: any }) {
  const { formGroup, vertical, column, gap } = props.commonProps
  const _props = useListenProps(formGroup, props.field.path, props.field, props.commonProps)
  const { path, title, required, disabled, readonly, hidden, errors, tooltip, widget, span = 1 } = _props
  const { children } = props

  // console.log('render form item', path, children)

  let tooltipComponent
  if (tooltip) {
    tooltipComponent = (
      <Tooltip placement='bottom' title={tooltip}><QuestionCircleOutlined /></Tooltip>
    )
  }

  let itemClassName = `fok-form-item fok-form-item-col-span-${span}`
  let style = { display: hidden ? 'none' : '', width: `${100 / column * span}%`, paddingRight: `${gap}px` }

  let colon = ':'
  if (vertical) {
    itemClassName += ' fok-form-item-vertical'
    colon = ''
  }

  // 将监听过得属性传递给子组件
  const clonedChildren = React.cloneElement(children, { ..._props, commonProps: props.commonProps })

  return <div className={itemClassName} style={style} data-key={path}>
    <label className='fok-form-item-label'>
      <b className='fok-form-item-required'>{(required && !readonly && widget !== 'text') ? '*' : ''}</b>
      <span>
        {title}
        {tooltip && <span className='fok-form-item-tooltip'>{tooltipComponent}</span>}
      </span>
      {colon}
    </label>
    <div className='fok-form-item-control-errors-wrapper'>
      {/* <div className='fok-form-item-control-container'>{children}</div> */}
      <div className='fok-form-item-control-container'>{clonedChildren}</div>
      <div className='fok-form-item-errors'>
        {!disabled && !readonly && !!errors.length && errors.map(err => {
          return <small className='fok-form-item-error' key={err.message} title={err.message}>{err.message}</small>
        })}
      </div>
    </div>
  </div>
}