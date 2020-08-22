import { FieldPropsT } from '@/core/types'
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
      // <Tooltip placement='bottom' title={tooltip}>hello</Tooltip>
    )
  }

  let itemClassName = `fok-form-item fok-form-item-col-span-${span}`
  let style = { dispaly: hidden ? 'none' : '', width: `calc(${100 / column * span}% - ${gap}px)`, marginRight: `${gap}px` }
  const feedbackStyle = {}

  if (vertical) {
    itemClassName += ' fok-form-item-vertical'
    return <div className={itemClassName} style={style} dataKey={fieldKey}>
      <label className='fok-form-item-label'>
        <b className='fok-form-item-required'>{(required && !readonly && widget !== 'text') ? '*' : ''}</b>
        <span>
          {title}
          {tooltip && <span className='fok-form-item-tooltip'>{tooltipComponent}</span>}
        </span>
      </label>
      <div className='fok-form-item-control-container'>{children}</div>
      <div className='fok-form-item-errors'>
        {!disabled && !readonly && !!errors.length && errors.map(err => {
          return <small className='fok-form-item-error' key={err.message} title={err.message}>{err.message}</small>
        })}
      </div>
    </div>
  } else {
    return <div className={itemClassName} style={style} dataKey={fieldKey}>
      <label className='fok-form-item-label'>
        <b className='fok-form-item-required'>{(required && !readonly && widget !== 'text') ? '*' : ''}</b>
        <span>
          {title}
          {tooltip && <span className='fok-form-item-tooltip'>{tooltipComponent}</span>}
        </span>
      </label>
      <div className='fok-form-item-control-container'>{children}</div>
      <div className='fok-form-item-errors'>
        {!disabled && !readonly && !!errors.length && errors.map(err => {
          return <small className='fok-form-item-error' key={err.message} title={err.message}>{err.message}</small>
        })}
      </div>
    </div>
  }
}