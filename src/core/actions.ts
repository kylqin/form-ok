import _ from 'lodash'
import { FormGroup } from './form-group';
import { TaskManager } from './task-manager';
import { PlainObject, FieldDefineT, FieldPropsT, FieldExtT } from './types';
import { ValidateOptions, validateField, validateFields, ValidateCombine } from './validation';
import { FormCommonPropsT, createMemoPropsGetter } from './fields';

export class ActionsT {
  public _taskManager = new TaskManager()

  constructor (private formGroup: FormGroup) {}

  init (data: PlainObject) {}

  newField (field: FieldDefineT) {}

  changeField (path: string, value: any, actionId?: string) {
    console.log('changeField ->', path, value, actionId)
    actionChangeField(this, this.formGroup, path, value, actionId)
  }

  changeFields (changeMap: PlainObject, actionId?: string) {
    actionChangeFields(this, this.formGroup, changeMap, actionId)
  }

  deleteFeild (path: string) {}

  setError (path: string, message: string) {
    console.log('setError ->', path, message)
    this.formGroup.updateField(path, (field: FieldExtT) => {
      field.errors = [{ message: message }]
    })
  }

  deleteError (path: string) {
    this.formGroup.updateField(path, (field: FieldExtT) => {
      field.errors = []
    })
  }

  clearErrors () {}

  submit (type: 'validate|ignoreRequired|force') {}
  submitDone () {}

  validate (path: null|string|string[], validateOptions: ValidateOptions) {
    return actionValidate(this, this.formGroup, path, validateOptions)
  }

  // _triggerWatch
  // _triggerWatchMulti
}

/** initial data */
function actionInit (actions: ActionsT, formGroup: FormGroup, data: PlainObject) {
  formGroup.data = data
}

/** new field */
function actionNewField (actions: ActionsT, formGroup: FormGroup, field: FieldDefineT) {
  // TODO: 合并到 formGroup 现有的 fieldSchema 和 fieldMap 中
}

/** changeField 改变 field 的 value 值 */
function actionChangeField (actions: ActionsT, formGroup: FormGroup, path: string, value: any, actionId?: string) {
  // 改变 data
  formGroup.updateData(path, value)
  formGroup.updateField(path, field => {
    field.markNeedSyncValue()
    formGroup.eventBus.dispatchValueUpdate(path)
  })

  actionUtilTrigger(actions, formGroup, path, actionId)
}

/** changeFields 根据 pathValueMap 改变 field 的 value */
function actionChangeFields (actions: ActionsT, formGroup: FormGroup, pathValueMap: PlainObject, actionId?: string) {
  const paths = Object.paths(pathValueMap)
  // const values = []
  // 改变 data
  paths.forEach(path => {
    formGroup.updateData(path, pathValueMap[path])
    formGroup.updateField(path, field => {
      field.markNeedSyncValue()
      formGroup.eventBus.dispatchValueUpdate(path)
    })
  })
  actionUtilTrigger(actions, formGroup, paths, actionId)
}

/** trigger onChange events & validation & watch & compute */
function actionUtilTrigger (actions: ActionsT, formGroup: FormGroup, path: string|string[], actionId?: string) {
  // TODO: 触发 onChange 事件 吗？
  // 触发 watch
  actionUtilTriggerWatch(actions, formGroup, path, actionId)
  // 触发 validation
  actionUtilTriggerValidation(actions, path)
  // 触发 compute
  actionUtilTriggerCompute(actions, formGroup, path, actionId)

  // TODO: nextTick 执行 tasks
  Promise.resolve().then(() => {
    // console.log(actions._taskManager)
    actions._taskManager.run()
  }).then(() => {
    formGroup.fields().forEach(field => {
      if (field!.propsDirty) {
        formGroup.eventBus.dispatchPropsUpdate(field!.path)
      }
    })
  })
}


/** 触发 watch */
function actionUtilTriggerWatch (actions: ActionsT, formGroup: FormGroup, path: string|string[], actionId?: string) {
  const watchers = formGroup.fieldWatchers(path)
  watchers.forEach(watcher => {
    actions._taskManager.add(() => watcher.handler(...watcher.values, { actionId, path, formGroup }))
  })
}

/** 触发 validation */
function actionUtilTriggerValidation (actions: ActionsT, path: string|string[]) {
  actions._taskManager.add(() => actions.validate(path, { ignoreRequired: false, validatorMap: {} })) // TODO: 注册 validatorMap
}

/** 触发 watch */
function actionUtilTriggerCompute (actions: ActionsT, formGroup: FormGroup, path: string|string[], actionId?: string) {
  const computes = formGroup.fieldComputes(path)
  computes.forEach(compute => {
    actions._taskManager.add(() => {
      const [path, prop] = compute.pathProp.split(':')
      formGroup.updateComputed(path, prop, compute.handler(...compute.values, { actionId, path, formGroup }))
    })
  })
}

type ActionValidateResultT = [string|string[], string][]

/** 验证 => Promise<[path|path[], message][]> */
async function actionValidate (
  actions: ActionsT,
  formGroup: FormGroup,
  path: null|string|string[],
  validatorOptions: ValidateOptions): Promise<ActionValidateResultT> {
  const commonProps: FormCommonPropsT = { formGroup, readonly: false, disabled: false }
  createMemoPropsGetter(commonProps)

  // console.log('commonProps ->', commonProps)

  const validateSingle = async (f: FieldPropsT): Promise<ActionValidateResultT> => {
    try {
      await validateField(f.validators, f.value, f.path);
      actions.deleteError(f.path);
      return []
    }
    catch (message) {
      console.log('err message', f.path, message);
      actions.setError(f.path, message);
      return [[f.path, message]];
    }
  }

  const validateCombines = async (combines: ValidateCombine[], parallel = true): Promise<ActionValidateResultT> => {
    const validateCombine = async (combine: ValidateCombine): Promise<ActionValidateResultT> => {
      try {
        await validateFields([combine.validator], combine.values);
        for (const path of combine.validator[0]) {
          actions.deleteError(path);
        }
        return [];
      }
      catch (message) {
        console.log('err messge multi', combine.validator[0], message);
        for (const path_2 of combine.validator[0]) {
          actions.setError(path_2, message);
        }
        return [[combine.validator[0], message]];
      }
    }

    if (parallel) {
      // 同时验证
      const vrl = (await Promise.all(combines.map(validateCombine))).filter(vr => vr.length).flatMap(vr => vr)
      return vrl
    } else {
      // 线性验证，前面的验证失败，则跳过后面的验证
      for (const combine of combines) {
        const validateResult = validateCombine(combine)
        if (validateResult) {
          return validateResult
        }
      }
      return []
    }
  }

  if (typeof path === 'string') {
    // 验证 单个 字段
    const field = formGroup.field(path)
    if (!field) {
      // 找不到 Field
      return []
    }
    const fieldProps = commonProps.propsGetter!(field)

    const combines = formGroup.fieldValidators(path)

    if (!combines.length) {
      // 如果没有 组合 验证, 则只执行 Field 自己的验证器
      return await validateSingle(fieldProps)
    } else {
      // 否则，还要执行组合验证器
      let validateResult = await validateSingle(fieldProps)
      if (validateResult) {
        return validateResult
      } else {
        return await validateCombines(combines, false) // 懒惰验证，遇到失败就返回
      }
    }
  } else {
    // 验证 多个字段 / 所有字段
    const combines = formGroup.fieldValidators(path) // path is null|string[]
    const fieldPropsArr = formGroup.fields(path).filter(f => f).map(f => commonProps.propsGetter!(f!))
    const validateSingelsResult = await Promise.all(fieldPropsArr.map(validateSingle))
        .then(errors => errors.filter(e => e.length).flatMap(e => e))
    if (combines.length) {
      // 如果没有组合验证器, 只执行所有的单字段验证器
      return validateSingelsResult
    } else {
      const validateCombinesResult = await validateCombines(combines)
      return validateCombinesResult.concat(validateCombinesResult)
    }
  }
}