import 'antd/dist/antd.css'
import React, { useState } from 'react'
// import { FormItem } from '../react/antd/form-item'
import './App.css'
import { fields } from './define-fields'
import './test'
import { InputSet } from '/@/react/antd/input-set'
import { useFormGroup } from '/@/react/hooks'
// import { InputSet } from '../react/antd/input-set'
// import { useFormGroup } from '../react/hooks'



console.log('fields ->', fields)

function App() {
  const [count, setCount] = useState(0)
  const formGroup = useFormGroup({ fields })
  const tooltip = 'Just tooltip'

  return (
    <div className="App">
      <InputSet formGroup={formGroup} />
    </div>
  )
}

export default App
