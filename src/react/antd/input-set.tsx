import React from 'react'
import { BoxWidget } from './combinations/box'
import { ArrayWidget } from './combinations/array'
import { FormItem } from './form-item'
import { WidgetMap } from './widget-map'

import './widgets'

import { FieldExtT, FieldPropsT } from '/@/core/types'
import { FormCommonPropsT, createMemoPropsGetter } from '/@/core/fields'
import { FormGroup } from '/@/core/form-group'

export type FormCommonPropsExtT = FormCommonPropsT & {
  vertical: boolean
  column: number
  gap: number
}

function createBoxComponent (field: FieldPropsT, commonProps: FormCommonPropsExtT) {
  return <BoxWidget key={field.fieldKey!} field={field} commonProps={commonProps} />
}

function createArrayComponent (field: FieldPropsT, commonProps: FormCommonPropsExtT) {
  return <ArrayWidget key={field.fieldKey!} field={field} commonProps={commonProps} />
}

export function renderCtrls (fields: FieldExtT[], commonProps: FormCommonPropsExtT) {
  return fields.map(field => {
    if (!field) return

    const fieldProps = commonProps.propsGetter!(field)
    let Comp
    if (!fieldProps.widget) {
      fieldProps.widget = 'input'
    }
    // console.log('fieldProps ->', fieldProps)
    switch (field.widget) {
      case 'box':
      case 'group':
      case 'object':
        Comp = createBoxComponent(fieldProps, commonProps)
        break;
      case 'array':
        Comp = createArrayComponent(fieldProps, commonProps)
        break;
      default:
        const widgetOptions = WidgetMap[fieldProps.widget]
        if (!widgetOptions) {
          throw Error(`Invalid Widget Type ${fieldProps.widget}`)
        }
        const key = fieldProps.fieldKey!
        // console.log('(commonProps.readonly || fieldProps.readonly) && widgetOptions.readonly')
        // console.log((commonProps.readonly || fieldProps.readonly) && widgetOptions.readonly)
        if ((commonProps.readonly || fieldProps.readonly) && widgetOptions.readonly) {
          if (widgetOptions.notField || widgetOptions.noWrapper) {
            Comp = <widgetOptions.widget {...fieldProps} commonProps={commonProps} key={key} />
          } else if (widgetOptions.noWrapper) {
            Comp = <widgetOptions.readonly {...fieldProps} commonProps={commonProps} key={key} />
          } else {
            Comp = <FormItem field={fieldProps} commonProps={commonProps} key={key}><widgetOptions.readonly {...fieldProps} commonProps={commonProps} /></FormItem>
          }
        } else {
          if (widgetOptions.notField || widgetOptions.noWrapper) {
            Comp = <widgetOptions.widget {...fieldProps} commonProps={commonProps} key={key} />
          } else {
            Comp = <FormItem field={fieldProps} commonProps={commonProps} key={key}><widgetOptions.widget {...fieldProps} commonProps={commonProps} /></FormItem>
          }
        }
        break
    }
    return Comp
  })
}

export type InputSetPropsT = {
  formGroup: FormGroup
  fieldsSelector?: string,
  vertical?: boolean
  readonly?: boolean
  column?: number
  gap?: number
}

export function InputSet (props: InputSetPropsT) {
  const { formGroup, vertical = false, readonly = false, column = 3, gap = 20 } = props

  const fields: FieldExtT[] = formGroup.fieldSchema

  const iptSetClassName = 'fok-form-input-set' +
    ` fok-form-input-set-column-${column}` +
    ` fok-form-input-set-gap-${gap}` +
    (vertical ? ' fok-form-input-set-vertical' : '') +
    (readonly ? ' fok-form-input-set-readonly' : '')

  const commonProps: FormCommonPropsExtT = { formGroup, readonly, vertical, column, gap, disabled: false }
  createMemoPropsGetter(commonProps)

  const FormComps = renderCtrls(fields, commonProps)
  return <div className={iptSetClassName}>{FormComps}</div>
}