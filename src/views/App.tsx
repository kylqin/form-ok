import 'antd/dist/antd.css'
import React, { useState } from 'react'
// import { FormItem } from '../react/antd/form-item'
import './App.css'
import { fields, watch, initialData } from './define-fields'
// import './test'
import { InputSet } from '/@/react/antd/input-set'
import { useFormGroup } from '/@/react/hooks'
import { ContentBox } from '../react/antd/combinations/content-box'
import { Input } from 'antd'
// import { InputSet } from '../react/antd/input-set'
// import { useFormGroup } from '../react/hooks'



console.log('fields ->', fields)
const fieldsV = fields.map(f => ({ ...f, path: f.path + '_v' }))

const WrappedInput = ({value, setValue, color, setColor}) => {
  console.log('value in ->', value)
  return <Input value={value} style={{ color }} onChange={e => { const v = e.target.value; setValue(v); Promise.resolve().then(() => setColor(v === 'red' ? 'red' : 'black')) }} />
}

function App() {
  const formGroup = useFormGroup({ fields, watch }, initialData)
  // const formGroupV = useFormGroup({ fields: fieldsV })
  const [value, setValue] = useState()
  const [color, setColor] = useState()

  console.log('value out ->', value)

  return (
    <div className="App">
      <ContentBox title='Inputs'>
        <InputSet formGroup={formGroup} />
      </ContentBox>
      {/* <ContentBox title='Inputs Vertical'>
        <InputSet formGroup={formGroupV} vertical />
      </ContentBox> */}
      <WrappedInput value={value} setValue={setValue} color={color} setColor={setColor} />
    </div>
  )
}

export default App
