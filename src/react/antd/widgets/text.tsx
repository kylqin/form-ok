import React from 'react'
import { FieldPropsBaseT, getValue } from '../base-widget'
import { registerWidgets } from '../register-widget'

function TextWidget (props: FieldPropsBaseT) {
  const { value } = props
  return <div className='fok-form-item-control-readonly'>{value || getValue(props)}</div>
}

const registered = registerWidgets({
  text: {
    widget: TextWidget,
    readonly: TextWidget
  }
})