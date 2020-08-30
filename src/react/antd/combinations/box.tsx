import React from 'react'
import { FormCommonPropsExtT, renderCtrls } from '../input-set'
import { ContentBox } from './content-box'
import { FieldPropsT } from '/@/core/types'

export const BoxWidget = (props: { field: FieldPropsT, commonProps: FormCommonPropsExtT }) => {
  const { hidden, path, title, properties } = props.field
  const { commonProps } = props

  if (hidden) { return <div /> }

  return <div key={path} className='fok-form-item-combination fok-form-item-combination-box'>
    <ContentBox title={title}>
      <div className='' style={{ display: 'flex', flexWrap: 'wrap' }}>
        {renderCtrls(properties!, commonProps)}
      </div>
    </ContentBox>
  </div>
}