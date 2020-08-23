import 'antd/dist/antd.css'
import React, { useState } from 'react'
// import { FormItem } from '../react/antd/form-item'
import './App.css'
import { fields } from './define-fields'
// import './test'
import { InputSet } from '/@/react/antd/input-set'
import { useFormGroup } from '/@/react/hooks'
import { ContentBox } from '../react/antd/combinations/content-box'
// import { InputSet } from '../react/antd/input-set'
// import { useFormGroup } from '../react/hooks'



console.log('fields ->', fields)
const fieldsV = fields.map(f => ({ ...f, key: f.key + '_v' }))

function App() {
  const [count, setCount] = useState(0)
  const formGroup = useFormGroup({ fields })
  const formGroupV = useFormGroup({ fields: fieldsV })
  const tooltip = 'Just tooltip'

  return (
    <div className="App">
      <ContentBox title='inputs'>
        <InputSet formGroup={formGroup} />
      </ContentBox>
      <ContentBox title='inputs vertical'>
        <InputSet formGroup={formGroupV} vertical />
      </ContentBox>
    </div>
  )
}

export default App
