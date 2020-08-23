import { FieldPropsT } from '/@/core/types'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import React from 'react'
import '../form-ok-react.scss'
import { FormCommonPropsExtT } from './input-set'

export function FormItem (props: { field: FieldPropsT, commonProps: FormCommonPropsExtT, children: any }) {
  const { vertical, column, gap } = props.commonProps
  const { fieldKey, title, required, disabled, readonly, hidden, tooltip, widget, span = 1, errors } = props.field
  const { children } = props

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

  return <div className={itemClassName} style={style} data-key={fieldKey}>
    <label className='fok-form-item-label'>
      <b className='fok-form-item-required'>{(required && !readonly && widget !== 'text') ? '*' : ''}</b>
      <span>
        {title}
        {tooltip && <span className='fok-form-item-tooltip'>{tooltipComponent}</span>}
      </span>
      {colon}
    </label>
    <div className='fok-form-item-control-errors-wrapper'>
      <div className='fok-form-item-control-container'>{children}</div>
      <div className='fok-form-item-errors'>
        {!disabled && !readonly && !!errors.length && errors.map(err => {
          return <small className='fok-form-item-error' key={err.message} title={err.message}>{err.message}</small>
        })}
      </div>
    </div>
  </div>
}