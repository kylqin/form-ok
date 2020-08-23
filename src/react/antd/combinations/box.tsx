import { FieldPropsT } from '@/core/types'
import React from 'react'
import { FormCommonPropsExtT, renderCtrls } from '../input-set'
import { ContentBox } from './content-box'

export const BoxWidget = (props: { field: FieldPropsT, commonProps: FormCommonPropsExtT }) => {
  const { readonly, disabled, hidden, fieldKey, title, properties } = props.field
  const { commonProps } = props

  if (hidden) { return <div /> }

  const _properties = properties.map(field => {
    return {
      ...field,
      hidden: hidden || field.hidden,
      readonly: readonly || field.readonly,
      disabled: disabled || field.disabled
    }
  })

  return <div key={fieldKey} className='fok-form-item-combination fok-form-item-combination-box'>
    <ContentBox title={title}>
      <div className='' style={{ display: 'flex', flexWrap: 'wrap' }}>
        {renderCtrls(_properties, commonProps)}
      </div>
    </ContentBox>
  </div>
}