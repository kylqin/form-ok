import { useEffect, useMemo, useState } from 'react'
import { FormCommonPropsExtT } from './antd/input-set'
import { BaseWidget } from './antd/widgets'
import { createFormGroup, FormGroup, FormGroupSchema } from '/@/core/form-group'
import { PlainObject } from '/@/core/types'

export function useFormGroup (schema: FormGroupSchema, initialData: PlainObject = {}) {
  const formGroup = useMemo(() => { return createFormGroup(schema, initialData) }, [])

  return formGroup
}

export function useListenProps (formGroup: FormGroup, path: string, initialProps: PlainObject, commonProps: FormCommonPropsExtT) {
  const [props, setProps] = useState(initialProps)

  useEffect(() => {
    const updateProps = () => {
      const newProps = commonProps.propsGetter!(formGroup.field(path)!)
      console.log('useListenProps updateProps', path, props, newProps)
      setProps(newProps)
    }

    formGroup.eventBus.add(path, updateProps)
    return () => { formGroup.eventBus.remove(path, updateProps)}
  }, [path])

  return props
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