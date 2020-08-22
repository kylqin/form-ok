import React from 'react'
import { FieldPropsT } from '@/core/types'
import { FormCommonPropsT } from '@/core/fields'
import { ContentBox } from './content-box'

export const BoxItem = (props: { field: FieldPropsT, commonProps: FormCommonPropsT }) => {
  const { readonly, disabled, hidden, fieldKey, title, properties } = props.field

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