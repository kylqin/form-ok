import React from 'react'
import { BaseWidget } from './base-widget'
import { registerWidgets } from './register-widget'

class TextWidget extends BaseWidget {
  render () {
    const { value } = this.props
    return <div className='fok-form-item-control-readonly'>{value || this.getAttrs.value}</div>
  }
}

const registered = registerWidgets({
  text: {
    widget: TextWidget,
    readonly: TextWidget
  }
})