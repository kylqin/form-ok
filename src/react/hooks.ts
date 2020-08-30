import { useEffect, useMemo, useState } from 'react'
import { FormCommonPropsT } from '/@/core/fields'
import { createForm, Form, FormSchema } from '../core/form'
import { PlainObject } from '/@/core/utils'

export function useForm (schema: FormSchema, initialData: PlainObject = {}) {
  const Form = useMemo(() => { return createForm(schema, initialData) }, [])

  return Form
}

export function useListenProps (Form: Form, path: string, initialProps: PlainObject, commonProps: FormCommonPropsT) {
  const [props, setProps] = useState(initialProps)

  useEffect(() => {
    const updateProps = () => {
      const newProps = commonProps.propsGetter!(Form.field(path)!)
      console.log('useListenProps updateProps', path, newProps)
      setProps(newProps)
    }

    return Form.eventBus.listenPropsUpdate(path, updateProps)
  }, [path])

  return props
}

export function useListenValue (Form: Form, path: string, initialValue: any) {
  const [value, setValue] = useState(initialValue)
  useEffect(() => {
    return Form.eventBus.listenValueUpdate(path, () => {
      console.log('uselistenValue updateValue ->', path, Form.field(path)!.value)
      setValue(Form.field(path)!.value)
    })
  }, [path])
  return value
}
