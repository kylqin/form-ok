import React, { useState } from 'react'
import { Card } from 'antd'
import { LeftOutlined, DownOutlined } from '@ant-design/icons'

export function ContentBox ({ defaultClosed = false, title = '', children, ...props}) {
  const [collapsed, setCollpased] = useState(defaultClosed)

  return <Card
    {...props}
    title={title}
    className={`fok-content-box ${collapsed ? 'fok-content-box-collapsed' : ''}`}
    extra={title && <div onClick={() => setCollpased(!collapsed)}>{collapsed ? <LeftOutlined /> : <DownOutlined/>}</div>}
  >
    <div className='fok-content-box-content'>
      {children}
    </div>
  </Card>
}