import 'antd/dist/antd.css'
import React, { useState } from 'react'
import { FormItem } from '../react/antd/FormItem'
import './App.css'
import { fields } from './define-fields'
import './test'



console.log('fields ->', fields)

function App() {
  const [count, setCount] = useState(0)
  const tooltip = 'Just tooltip'

  return (
    <div className="App">
      <FormItem fieldKey="key__1" title="是title" tooltip="hello world tooltip"/>
    </div>
  )
}

export default App
