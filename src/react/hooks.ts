// import { createFormGroup }  from '@/core/form-group'
import { FormGroupSchema, createFormGroup, FormGroup } from '/@/core/form-group'
import { PlainObject } from '/@/core/types'
import { useMemo, useState, useEffect, ReactComponentElement } from 'react'

export function useFormGroup (schema: FormGroupSchema, initialData: PlainObject = {}) {
  const formGroup = useMemo(() => { console.log('<memo>'); return createFormGroup(schema, initialData) }, [])

  return formGroup
}

export function useListen (formGroup: FormGroup, key: string, prop: string, initialValue: any) {
  const [val, setVal] = useState(initialValue)

  useEffect(() => {
    formGroup.eventBus.add(key, () => {
      // console.log('event bus ->', key, prop)
      setVal((formGroup.field(key)! as any)[prop])
    })
  }, [])
  return val
}

export function useListenState (comp: React.Component, formGroup: FormGroup, key: string, prop: string, initialValue: any) {
  formGroup.eventBus.add(key, () => {
    console.log('uselistenState event bus ->', key, prop)
    comp.setState({
      [prop]: (formGroup.field(key)! as any)[prop]
    })
  })

  return initialValue
}