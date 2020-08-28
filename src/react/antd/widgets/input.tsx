import React from 'react'
import { Input } from 'antd'
import { BaseWidget } from './base-widget'
import { registerWidgets } from './register-widget'

export class InputWidget extends BaseWidget {
  render () {
    // console.log('this.getAttrs(), this.getInputProps()', this.getAttrs(), this.getInputProps())
    // const { value, ...inputProps } = this.getInputProps()
    const inputProps = this.getInputProps()
    // console.log('inputProps ->', inputProps)
    return <Input {...inputProps} />
    // return <Input {...this.getAttrs()} />
    // return <Input {...this.getAttrs()} {...this.getInputProps()} />
  }
}

export class TextareaWidget extends BaseWidget {
  render () {
    return <Input.TextArea {...this.getAttrs()} {...this.getInputProps()} />
  }
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