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

export type FieldTypeT = 'number' | 'string' | 'boolean' | 'object' | 'array' | 'date'
// export enum  FieldTypeT

export class FieldT {
  constructor(
    public key: string = '',
    public title: string = '',
    public value?: any,
    public errors: ErrorT[] = [],
    public required?: boolean,
    public validators: ValidatorT[] = [],

    public type: FieldTypeT = 'string',
    public enums?: EnumItemT[],

    public widget: string = 'input',

    public attrs?: PlainObject,

    public properties?: FieldT[]
  ) {}
}

export function createField ({ key, title, value, errors, required, validators, type, enums, widget, attrs, properties }: { [key: string]: any }) {
  return new FieldT(key, title, value, errors, required, validators, type, enums, widget, attrs, properties)
}

export class FieldExtT extends FieldT {
  public originKey: string
  public group?: FieldT
  public parent?: FieldT

  public onChange?: Function
  public onBlur?: Function

  public compute?: { [prop: string]: Function }

  constructor(...props: any[]) {
    super(...props)
    this.originKey = this.key
  }
}