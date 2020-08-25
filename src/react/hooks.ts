// import { createFormGroup }  from '@/core/form-group'
import { FormGroupSchema, createFormGroup, FormGroup } from '/@/core/form-group'
import { PlainObject } from '/@/core/types'
import { useMemo, useState, useEffect, ReactComponentElement } from 'react'
import { BaseWidget } from './antd/widgets';

export function useFormGroup (schema: FormGroupSchema, initialData: PlainObject = {}) {
  const formGroup = useMemo(() => { return createFormGroup(schema, initialData) }, [])

  return formGroup
}

export function useListen (formGroup: FormGroup, key: string, prop: string, initialValue: any) {
  const [val, setVal] = useState(initialValue)

  useEffect(() => {
    const updateVal = () => {
      // console.log('event bus ->', key, prop)
      setVal((formGroup.field(key)! as any)[prop])
    }

    formGroup.eventBus.add(key, updateVal)
    return () => { formGroup.eventBus.remove(key, updateVal)}
  }, [key])
  return val
}

export function useListenState (comp: BaseWidget, formGroup: FormGroup, key: string, prop: string, initialValue: any) {
  const listenersToRemove: [string, () => void][] = []
  const updateVal = () => {
    console.log('uselistenState event bus ->', key, prop, (formGroup.field(key)! as any)[prop])
    comp.setState({
      [prop]: (formGroup.field(key)! as any)[prop]
    })
  }
  listenersToRemove.push([key, updateVal])
  formGroup.eventBus.add(key, updateVal)

  return () => {
      for (const l of listenersToRemove) {
        formGroup.eventBus.remove(l[0], l[1])
      }
  }
}