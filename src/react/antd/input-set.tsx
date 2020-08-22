import React from 'react'
import { BoxItem } from './combinations/box'
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
  return <BoxItem key={field.fieldKey!} field={field} commonProps={commonProps} />
}
function createGroupComponent (field: FieldPropsT, commonProps: FormCommonPropsExtT) {
  return <BoxItem key={field.fieldKey!} field={field} commonProps={commonProps} />
}
function createObjectComponent (field: FieldPropsT, commonProps: FormCommonPropsExtT) {
  return <BoxItem key={field.fieldKey!} field={field} commonProps={commonProps} />
}
function createArrayComponent (field: FieldPropsT, commonProps: FormCommonPropsExtT) {
  return <BoxItem key={field.fieldKey!} field={field} commonProps={commonProps} />
}

export function renderCtrls (fields: FieldExtT[], commonProps: FormCommonPropsExtT) {
  return fields.map(field => {
    if (!field) return

    const fieldProps = commonProps.propsGetter!(field)
    let Comp
    if (!fieldProps.widget) {
      fieldProps.widget = 'input'
    }
    switch (field.widget) {
      case 'box':
        Comp = createBoxComponent(fieldProps, commonProps)
        break;
      case 'group':
        Comp = createGroupComponent(fieldProps, commonProps)
        break;
      case 'object':
        Comp = createObjectComponent(fieldProps, commonProps)
        break;
      case 'array':
        Comp = createArrayComponent(fieldProps, commonProps)
        break;
      default:
        const widgetOptions = WidgetMap[fieldProps.widget]
        if (!widgetOptions) {
          throw Error(`Invalid Widget Type ${fieldProps.widget}`)
        }
        if ((commonProps.readonly || fieldProps.readonly) && widgetOptions.readonly) {
          if (widgetOptions.notField || widgetOptions.noWrapper) {
            Comp = <widgetOptions.widget {...fieldProps} />
          } else if (widgetOptions.noWrapper) {
            Comp = <widgetOptions.readonly {...fieldProps} />
          } else {
            Comp = <FormItem field={fieldProps} commonProps={commonProps}><widgetOptions.readonly {...fieldProps} /></FormItem>
          }
        } else {
          if (widgetOptions.notField || widgetOptions.noWrapper) {
            Comp = <widgetOptions.widget {...fieldProps} />
          } else {
            Comp = <FormItem field={fieldProps} commonProps={commonProps}><widgetOptions.widget {...fieldProps} /></FormItem>
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
  const { formGroup, vertical = false, readonly = false, column = 3, gap = 3 } = props

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