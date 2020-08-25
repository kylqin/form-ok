import { FormGroupSchema, createFormGroup, FormGroup } from '/@/core/form-group'
import { PlainObject } from '/@/core/types'
import { useMemo, useState, useEffect, ReactComponentElement } from 'react'
import { BaseWidget } from './antd/widgets';

export function useFormGroup (schema: FormGroupSchema, initialData: PlainObject = {}) {
  const formGroup = useMemo(() => { return createFormGroup(schema, initialData) }, [])

  return formGroup
}

export function useListen (formGroup: FormGroup, path: string, prop: string, initialValue: any) {
  const [val, setVal] = useState(initialValue)

  useEffect(() => {
    const updateVal = () => {
      // console.log('event bus ->', path, prop)
      setVal((formGroup.field(path)! as any)[prop])
    }

    formGroup.eventBus.add(path, updateVal)
    return () => { formGroup.eventBus.remove(path, updateVal)}
  }, [path])
  return val
}

export function useListenState (comp: BaseWidget, formGroup: FormGroup, path: string, prop: string, initialValue: any) {
  const listenersToRemove: [string, () => void][] = []
  const updateVal = () => {
    console.log('uselistenState event bus ->', path, prop, (formGroup.field(path)! as any)[prop])
    comp.setState({
      [prop]: (formGroup.field(path)! as any)[prop]
    })
  }
  listenersToRemove.push([path, updateVal])
  formGroup.eventBus.add(path, updateVal)

  return () => {
      for (const l of listenersToRemove) {
        formGroup.eventBus.remove(l[0], l[1])
      }
  }
}