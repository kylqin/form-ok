import { FieldPropsT } from '/@/core/types'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import React, { useState, useEffect } from 'react'
import '../form-ok-react.scss'
import { FormCommonPropsExtT } from './input-set'
import { useListen } from '../hooks'

export function FormItem (props: { field: FieldPropsT, commonProps: FormCommonPropsExtT, children: any }) {
  const { formGroup, vertical, column, gap } = props.commonProps
  const { path, title, required, disabled, readonly, hidden, tooltip, widget, span = 1 } = props.field
  // const { path, title, tooltip, widget, span = 1 } = props.field
  const { children } = props

  const errors = useListen(formGroup, path!, 'errors', props.field.errors)

  // const required = useListen(formGroup, path!, 'required', props.field.required)
  // const disabled = useListen(formGroup, path!, 'disabled', props.field.disabled)
  // const readonly = useListen(formGroup, path!, 'readonly', props.field.readonly)
  // const hidden = useListen(formGroup, path!, 'hidden', props.field.hidden)

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
      <div className='fok-form-item-control-container'>{children}</div>
      <div className='fok-form-item-errors'>
        {!disabled && !readonly && !!errors.length && errors.map(err => {
          return <small className='fok-form-item-error' key={err.message} title={err.message}>{err.message}</small>
        })}
      </div>
    </div>
  </div>
}