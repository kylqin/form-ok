import { useEffect, useMemo, useState } from 'react'
import { FormCommonPropsT } from '/@/core/fields'
import { createFormGroup, FormGroup, FormGroupSchema } from '/@/core/form-group'
import { PlainObject } from '/@/core/utils'

export function useFormGroup (schema: FormGroupSchema, initialData: PlainObject = {}) {
  const formGroup = useMemo(() => { return createFormGroup(schema, initialData) }, [])

  return formGroup
}

export function useListenProps (formGroup: FormGroup, path: string, initialProps: PlainObject, commonProps: FormCommonPropsT) {
  const [props, setProps] = useState(initialProps)

  useEffect(() => {
    const updateProps = () => {
      const newProps = commonProps.propsGetter!(formGroup.field(path)!)
      console.log('useListenProps updateProps', path, newProps)
      setProps(newProps)
    }

    return formGroup.eventBus.listenPropsUpdate(path, updateProps)
  }, [path])

  return props
}

export function useListenValue (formGroup: FormGroup, path: string, initialValue: any) {
  const [value, setValue] = useState(initialValue)
  useEffect(() => {
    return formGroup.eventBus.listenValueUpdate(path, () => {
      console.log('uselistenValue updateValue ->', path, formGroup.field(path)!.value)
      setValue(formGroup.field(path)!.value)
    })
  }, [path])
  return value
}
