import React from 'react'
import { registerWidgets } from './register-widget'


/** 占位 */
export class EmptyWidget extends React.Component {
  render () { return <div /> }
}

/** 横线 */
export class HorizentalLineWidget extends React.Component {
  render () {
    return <div style={{ width: '100%', backgroundColor: 'rgba(221,221,221,.5)', height: '1px', margin: '10px 0 20px' }} />
  }
}

/** 换行 HorizentalReturn */
export class HorizentalReturnWidget extends React.Component {
  render () { return <div style={{ width: '100%' }} />}
}

/** 标题 */
export class TitleLineWidget extends React.Component {
  render () {
    const { title } = this.props
    return <div style={{ borderBottom: '1px solid rgba(211,211,211,.5)', width: '100%', marginBottom: '20px', padding: '10px 80px 10px 0', fontWeight: 'bold' }}>
      <div>{title}</div>
    </div>
  }
}

const registered  = registerWidgets({
  empty: { widget: EmptyWidget, notField: true },
  hl: { widget: HorizentalLineWidget, notField: true },
  hr: { widget: HorizentalReturnWidget, notField: true },
  titleLine: { widget: TitleLineWidget, notField: true }
})

export const widgetEmpty = { widget: 'empty' }
export const widgetHl = { widget: 'hl' }
export const widgetHr = { widget: 'hr' }
export const widgetTitleLine = (title: string) => ({ widget: 'titleLine', title })