import React from 'react'
import { Input } from 'antd'
import { BaseWidget } from './base-widget'
import { registerWidgets } from './register-widget'

export class InputWidget extends BaseWidget {
  render () {
    return <Input {...this.getAttrs()} {...this.getInputProps()} />
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