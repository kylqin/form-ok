import 'antd/dist/antd.css'
import React, { useState } from 'react'
// import { FormItem } from '../react/antd/form-item'
import './App.css'
import { fields, watch, initialData } from './define-fields'
// import './test'
import { InputSet } from '/@/react/antd/input-set'
import { useFormGroup } from '/@/react/hooks'
import { ContentBox } from '../react/antd/combinations/content-box'
// import { InputSet } from '../react/antd/input-set'
// import { useFormGroup } from '../react/hooks'



console.log('fields ->', fields)
const fieldsV = fields.map(f => ({ ...f, path: f.path + '_v' }))

function App() {
  const formGroup = useFormGroup({ fields, watch }, initialData)
  // const formGroupV = useFormGroup({ fields: fieldsV })

  return (
    <div className="App">
      <ContentBox title='Inputs'>
        <InputSet formGroup={formGroup} />
      </ContentBox>
      {/* <ContentBox title='Inputs Vertical'>
        <InputSet formGroup={formGroupV} vertical />
      </ContentBox> */}
    </div>
  )
}

export default App
