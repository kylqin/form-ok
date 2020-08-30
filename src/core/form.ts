import _ from 'lodash';
import { ActionsT } from './actions';
import { getByDeps } from './dep-map';
import { EventBus } from './events';
import {
  ComputedMap, ComputesMap, FieldMap, FormSchema,
  uitlCreateNormalizedFieldsWithFlattenedMap, utilCreateComputesMap,
  utilCreateValidatorsMap,
  utilCreateWatchersMap,
  utilGetAllFields, utilGetFields,
  ValidatorsMap,
  WatcherDefineT, WatchersMap
} from './form-impl';
import { ComputePropT, FieldDefineT, FieldExtT } from './types';
import { PlainObject } from './utils';
import { MultiValidatorDefineT, ValidateCombine } from './validation';


export function createForm(
  schema: FormSchema,
  initalData: PlainObject
) {
  return new Form(schema.fields, schema.validators, schema.watch, initalData)
}

export class Form {
  private __fieldSchema: FieldExtT[]
  private __fieldMap: FieldMap
  private __dataSet: PlainObject
  private __errSet: PlainObject = {}
  private __allow: PlainObject = {}

  private __validatorsMap: ValidatorsMap
  private __watchersMap: WatchersMap
  private __computesMap: ComputesMap

  /** Map<path, Map<prop, propValue>> */
  private __computedMap: ComputedMap = new Map()

  public actions: ActionsT

  public eventBus = new EventBus()

  constructor (fields: FieldDefineT[] = [], private validators: MultiValidatorDefineT[] = [], private watch: WatcherDefineT[] = [], initalData: PlainObject) {
    [this.__fieldSchema, this.__fieldMap] = uitlCreateNormalizedFieldsWithFlattenedMap(fields)
    this.__validatorsMap = utilCreateValidatorsMap(this.validators)
    this.__watchersMap = utilCreateWatchersMap(this.watch)
    this.__computesMap = utilCreateComputesMap(this.__fieldMap)
    this.__dataSet = initalData
    this.actions = new ActionsT(this)
  }

  updateFieldSchema (fields: FieldDefineT[]) {
    [this.__fieldSchema, this.__fieldMap] = uitlCreateNormalizedFieldsWithFlattenedMap(fields)
    // setAllow(allow => ({ ...allow })) // TODO: hack 强制刷新, FXIME
  }

  updateSchema (schema: FormSchema) {
    if (schema.watch) {
      this.watch = schema.watch
    }
    if (schema.validators) {
      this.validators = schema.validators
    }
    if (schema.fields) {
      this.updateFieldSchema(schema.fields)
    }
  }

  syncFieldsValue (dataSet: PlainObject) {
    this.__dataSet = dataSet
    for (const field of this.__fieldMap.values()) {
      field.markNeedSyncValue()
    }
  }

  get fieldSchema () { return this.__fieldSchema }
  get data () { return this.__dataSet }
  set data (data: PlainObject) { this.__dataSet = data}
  get error () { return this.__errSet }
  set error (error: PlainObject) { this.__errSet = error }
  get allow () { return this.__allow }

  updateData (path: string, value: any) { _.set(this.__dataSet, path, value) }
  updateError (path: string, error: string) { this.__errSet[path] = error }
  updateAllow (path: string, allow: boolean) { this.__allow[path] = allow }

  field (path: string) { return utilGetFields(this.__fieldMap, this.__dataSet, [path])[0] }

  fields (paths: null|string[] = null): (FieldExtT|null)[] {
    if (paths) {
      return utilGetFields(this.__fieldMap, this.__dataSet, paths)
    } else {
      return utilGetAllFields(this.__fieldMap, this.__dataSet)
    }
  }

  // 直接在 field 上更新
  updateField (path: string, update: (field: FieldExtT) => void, notFund?: () => void) {
    const [field] = utilGetFields(this.__fieldMap, this.__dataSet, [path])
    if (field) {
      update(field)
      field.markNeedSyncProps()
    } else {
      notFund && notFund()
    }
  }

  fieldValidators (path: null|string|string[]): ValidateCombine[] {
    const filteredValidators = getByDeps(path, this.__validatorsMap)

    return filteredValidators.map((validator) => {
      return {
        validator,
        values: validator[0].map((path: string) => _.get(this.__dataSet, path))
      }
    })
  }

  fieldWatchers (path: string|string[]) {
    const filteredWatchers: WatcherDefineT[] = getByDeps(path, this.__watchersMap)

    return filteredWatchers.map(([deps, handler]) => {
      return {
        handler,
        paths: deps,
        values: deps.map((path: string) => _.get(this.__dataSet, path))
      }
    })
  }

  fieldComputes (path: string|string[]) {
    const filteredComputes: ComputePropT[] = getByDeps(path, this.__computesMap)

    return filteredComputes.map(([deps, [pathProp, handler]]) => {
      return {
        pathProp,
        handler,
        paths: deps,
        values: deps.map((path: string) => _.get(this.__dataSet, path))
      }
    })
  }

  fieldOwnComputes (path: string, prop?: string) {
    if (prop) {
      for (const computeArr of this.__computesMap.values()) {
        for (const _compute of computeArr) {
          const [deps, [pathProp, compute]] = _compute
          const [_path, _prop] = pathProp.split(':')
          if (path === _path && prop === _prop) {
            return [{
              pathProp,
              handler: compute,
              paths: deps,
              values: deps.map((path: string) => _.get(this.__dataSet, path))
            }]
          }
        }
      }
    } else {
      const computes = []
      for (const computeArr of this.__computesMap.values()) {
        for (const _compute of computeArr) {
          const [deps, [pathProp, compute]] = _compute
          const [_path] = pathProp.split(':')
          if (path === _path) {
            computes.push({
              pathProp,
              handler: compute,
              paths: deps,
              values: deps.map((path: string) => _.get(this.__dataSet, path))
            })
          }
        }
      }
      return computes
    }

    return []
  }

  updateComputed (path: string, prop: string, value: any) {
    if (!this.__computedMap.has(path)) {
      this.__computedMap.set(path, new Map())
    }
    const pathMap = this.__computedMap.get(path)!
    pathMap.set(prop, value)
    this.field(path)!.markNeedSyncProps()
  }

  computed (path?: string, prop?: string): ComputedMap|any {
    if (!path) {
      return this.__computedMap
    } else if (!prop){
      return this.__computedMap.get(path)
    } else {
      const pathMap = this.__computedMap.get(path)
      if (pathMap && pathMap.has(prop)) {
        return this.__computedMap.get(path)!.get(prop!)
      }
      const [compute] = this.fieldOwnComputes(path, prop)
      const value = compute.handler(...compute.values, {})
      this.updateComputed(path, prop, value)
      return value
    }
  }
}
