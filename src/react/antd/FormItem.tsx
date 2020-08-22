import React from 'react'
import { FieldPropsT } from '@/core/types'
import { FormCommonPropsT } from '@/core/fields'
import { Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import '../style.scss'

export function FormItem (props: FieldPropsT & { commonProps: FormCommonPropsT }) {
  // const { vertical, column, gap } = props.commonProps
  const { fieldKey, title, required, disabled, readonly, hidden, tooltip, widget, span = 1, children, errors } = props

  let tooltipComponent
  if (tooltip) {
    tooltipComponent = (
      <Tooltip placement='bottom' title={tooltip}><QuestionCircleOutlined /></Tooltip>
      // <Tooltip placement='bottom' title={tooltip}>hello</Tooltip>
    )
  }

  return <div>{fieldKey}: {title}{tooltipComponent}</div>
  // return <div>{fieldKey}: {title}{'h'}</div>
}