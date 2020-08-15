export class ErrorT {
  constructor(public message: string) {}
}

export type ValidateResult = {
  valid: boolean,
  message?: string
}

export type ValidatorT = (value: any) => ValidateResult

export type PlainObject = {
  [prop: string]: any
}

export type EnumItemT = {
  value: string|number,
  label: string
}

export type ComputePropT = (dataSet: any, field: FieldExtT, dsPack: PlainObject) => any

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
    public validators: (string|ValidatorT)[] = [],

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

export type OnChangeCallbackT = (value: any, text: string, dsPack: any) => void

export class FieldExtT extends FieldT {
  public originKey: string
  public group?: FieldExtT
  public parent?: FieldExtT

  public onChange?: OnChangeCallbackT
  public onBlur?: Function

  public compute?: { [prop: string]: ComputePropT }

  public readonly?: boolean

  constructor(...props: any[]) {
    super(...props)
    this.originKey = this.key
  }
}

// export type FieldPropsT = {
//   field: FieldExtT
//   props: FieldExtT
// }
export class FieldPropsT extends FieldExtT {
  public text: string = ''
}
