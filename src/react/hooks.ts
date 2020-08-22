// import { createFormGroup }  from '@/core/form-group'
import { FormGroupSchema, createFormGroup } from '/@/core/form-group'
import { PlainObject } from '/@/core/types'
import { useMemo } from 'react'

export function useFormGroup (schema: FormGroupSchema, initialData: PlainObject = {}) {
  const formGroup = useMemo(() => createFormGroup(schema, initialData), [])

  return formGroup
}