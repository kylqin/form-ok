import { Input } from 'antd'
import React from 'react'
import { useListenValue } from '../../hooks'
import { FieldPropsBaseT, getAttrs, getInputProps } from './base-widget-f'
import { registerWidgets } from './register-widget'

export function InputWidget (props: FieldPropsBaseT) {
  const { value: initialValue, ...inputProps } = getInputProps(props)
  const value = useListenValue(props.commonProps.formGroup, props.path, initialValue)

  return <Input {...inputProps} value={value} />
}

export function TextareaWidget (props: FieldPropsBaseT) {
  return <Input.TextArea {...getAttrs(props)} {...getInputProps(props)} />
}

const registered = registerWidgets({
  input: {
    widget: InputWidget,
    attrs: {
      allowClear: true
    }
  },
  textarea: {
    widget: TextareaWidget,
    attrs: {
      allowClear: true
    }
  }
})