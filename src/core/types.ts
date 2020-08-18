import _ from 'lodash';
import { FokValidatorDefineT } from './validation'
import { FormGroup } from './form-group'
import { clone } from './utils';

export class ErrorT {
  constructor(public message: string) {}
}


export type PlainObject = {
  [prop: string]: any
}

export type EnumItemT = {
  value: string|number,
  label: string
}

export type ComputePropT = (dataSet: any, field: FieldExtT, formGroup: FormGroup) => any

export type FieldTypeT = 'number' | 'string' | 'boolean' | 'object' | 'array' | 'date'
// export enum  FieldTypeT

export class FieldT {
  constructor(
    public key: string = '',
    public labelKey?: string,

    public title: string = '',
    public value?: any,
    public errors: ErrorT[] = [],
    public required?: boolean,
    public validators: FokValidatorDefineT[] = [],

    public type: FieldTypeT = 'string',
    public enums?: EnumItemT[],

    public widget: string = 'input',

    public attrs?: PlainObject,

    public properties?: FieldT[]
  ) {}
}

export function createField ({ key, labelKey, title, value, errors, required, validators, type, enums, widget, attrs, properties }: { [key: string]: any }) {
  return new FieldT(key, labelKey, title, value, errors, required, validators, type, enums, widget, attrs, properties)
}

export function createFieldExt (fieldDefine: FieldDefineT): FieldExtT {
  const { key, labelKey, title, value, errors, required, validators, type, enums, widget, attrs, properties, ...restProps } = fieldDefine
  const extField = new FieldExtT(key, labelKey, title, value, errors, required, validators, type, enums, widget, attrs, properties)
  const restPropNames = Object.keys(restProps)

  // 设置 compute
  extField.compute = restPropNames.reduce((acc: PlainObject, propName) => {
    if (propName.startsWith('c:')) {
      acc[propName.slice(0, propName.length - 3)] = restProps[propName]
    }
    return acc
  }, {})

  // 设置 originKey
  extField.originKey = key

  return extField
}

export type OnChangeCallbackT = (value: any, text: string, formGroup: FormGroup) => void

export class FieldExtT extends FieldT {
  public originKey!: string
  public originLabelKey?: string
  public group?: FieldExtT
  public parent?: FieldExtT

  public properties?: FieldExtT[]

  public onChange?: OnChangeCallbackT
  public onBlur?: Function

  public compute?: { [prop: string]: ComputePropT }

  public readonly?: boolean

  private __ok_needSyncValue: boolean = true
  private __ok_preValue?: any

  /** 同步 Field value */
  public syncFieldValue (dataSet: PlainObject) {
    if (this.__ok_needSyncValue) {
      this.__ok_preValue = this.value
      this.value = _.get(dataSet, this.key)
      this.__ok_needSyncValue = false
    }
  }
  /** 标记 Field 需要同步值 */
  public markNeedSyncValue (need = true) { this.__ok_needSyncValue = need }

  /** clone */
  public clone () { return clone(this, new FieldExtT()) as FieldExtT }
}

// export type FieldPropsT = {
//   field: FieldExtT
//   props: FieldExtT
// }
export class FieldPropsT extends FieldExtT {
  public text: string = ''

  static fromFieldExtT (fieldExt: FieldExtT): FieldPropsT {
    return clone(fieldExt, new FieldPropsT()) as FieldPropsT
  } 
}

export interface FieldDefineT extends FieldExtT {
  [key: string]: any
}
