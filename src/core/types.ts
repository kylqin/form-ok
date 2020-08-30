import _ from 'lodash';
import { Form } from './form';
import { clone, PlainObject } from './utils';
import { FokValidatorDefineT } from './validation';

export type ValueParserT = {
  toData: (value: any, field: FieldPropsT) => any
  toWidget: (value: any, field: FieldPropsT) => any
}

export class ErrorT {
  constructor(public message: string) {}
}

export type EnumItemT = {
  value: string|number,
  label: string
}

type ComputePropsParamEnv = {
  data: any,
  field: FieldExtT,
  Form: Form
}

/** [deps, computeFn] */
export type ComputePropDefineT = [string[], (...fieldValuesAndEnv: (any|ComputePropsParamEnv)[]) => any]
/** [deps, [path:prop, computeFn]] */
export type ComputePropT = [string[], [string, (...fieldValuesAndEnv: (any|ComputePropsParamEnv)[]) => any]]

export type OnChangeCallbackT = (value: any, text: string, Form: Form) => void

export type FieldTypeT = 'number' | 'string' | 'boolean' | 'object' | 'array' | 'date'
// export enum  FieldTypeT

export class FieldT {
  constructor(
    public path: string = '',
    public labelPath?: string,

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

export class FieldExtT extends FieldT {
  public defineKey!: string
  public defineLabelKey?: string
  public group?: FieldExtT
  public parent?: FieldExtT

  public properties?: FieldExtT[]

  public onChange?: OnChangeCallbackT
  public onBlur?: Function

  public compute?: { [prop: string]: ComputePropDefineT }

  public readonly?: boolean

  public exts: PlainObject = {}

  private __ok_needSyncValue?: boolean = true
  private __ok_preValue?: any
  private __ok_needSyncProps?: boolean = true

  get valueDirty () { return this.__ok_needSyncValue }
  get propsDirty () { return this.__ok_needSyncProps }

  /** 同步 Field value */
  public syncFieldValue (dataSet: PlainObject) {
    if (this.__ok_needSyncValue) {
      this.__ok_preValue = this.value
      this.value = _.get(dataSet, this.path)
      this.__ok_needSyncValue = false
    }
  }
  /** 标记 Field 需要同步值 */
  public markNeedSyncValue (need = true) { this.__ok_needSyncValue = need; if (need) { this.__ok_needSyncProps = need } }
  /** 标记 Field 需要同步属性 */
  public markNeedSyncProps (need = true) { this.__ok_needSyncProps = need }

  /** clone */
  public clone () { return clone(this, new FieldExtT()) as FieldExtT }
}

export class FieldPropsT extends FieldExtT {
  public text: string = ''
  public disabled?: boolean
  public hidden?: boolean
  public tooltip?: string
  public span?: number = 1

  static fromFieldExtT (fieldExt: FieldExtT): FieldPropsT {
    const props = clone(fieldExt, new FieldPropsT()) as FieldPropsT
    props.disabled = fieldExt.exts.disabled
    props.hidden = fieldExt.exts.hidden
    props.tooltip = fieldExt.exts.tooltip
    props.span = fieldExt.exts.span
    return props
  }
}

export interface FieldDefineT extends FieldExtT {
  properties?: FieldDefineT[],
  key: string,
  labelKey?: string,
  [path: string]: any
}

export function createField ({ path, labelPath, title, value, errors, required, validators, type, enums, widget, attrs, properties }: { [path: string]: any }) {
  return new FieldT(path, labelPath, title, value, errors, required, validators, type, enums, widget, attrs, properties)
}

export function createFieldExt (fieldDefine: FieldDefineT): FieldExtT {
  const { path, key, labelKey, title, value, errors, required, validators, type, enums, widget, attrs, properties, /** */readonly, ...restProps } = fieldDefine
  const extField = new FieldExtT(path || key, labelKey, title, value, errors, required, validators, type, enums, widget, attrs, properties)
  const restPropNames = Object.keys(restProps)

  // 设置 defineKey
  extField.defineKey = key

  extField.readonly = readonly
  extField.exts = restProps

  // 设置 compute
  extField.compute = restPropNames.reduce((acc: { [prop: string]: ComputePropDefineT }, propName) => {
    if (propName.startsWith('c:')) {
      const prop = propName.slice(2)
      acc[prop] = restProps[propName]
    }
    return acc
  }, {})

  return extField
}
