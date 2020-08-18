import * as _ from 'lodash'
import { FormGroup } from './form-group';
import { TaskManager } from './task-manager';
import { PlainObject, FieldDefineT, FieldPropsT } from './types';
import { ValidateOptions, validateField, validateFields, ValidateCombine } from './validation';
import { FormCommonPropsT, createMemoPropsGetter } from './fields';

export class ActionsT {
  public _taskManager = new TaskManager()

  constructor (private formGroup: FormGroup) {}

  init (data: PlainObject) {}

  newField (field: FieldDefineT) {}

  changeField (key: string, value: any, actionId: string) {
    actionChangeField(this, this.formGroup, key, value, actionId)
  }

  changeFields (changeMap: PlainObject, actionId: string) {
    actionChangeFields(this, this.formGroup, changeMap, actionId)
  }

  deleteFeild (key: string) {}

  setError (key: string, message: string) {}

  deleteError (key: string) {}

  clearErrors () {}

  submit (type: 'validate|ignoreRequired|force') {}
  submitDone () {}

  validate (key: null|string|string[], validateOptions: ValidateOptions) {
    return actionValidate(this, this.formGroup, key, validateOptions)
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
function actionChangeField (actions: ActionsT, formGroup: FormGroup, key: string, value: any, actionId: string) {
  // 改变 data
  formGroup.updateData(key, value)

  actionUtilTrigger(actions, formGroup, key, actionId)
}

/** changeFields 根据 keyValueMap 改变 field 的 value */
function actionChangeFields (actions: ActionsT, formGroup: FormGroup, keyValueMap: PlainObject, actionId: string) {
  const keys = Object.keys(keyValueMap)
  // const values = []
  // 改变 data
  keys.forEach(key => {
    formGroup.updateData(key, keyValueMap[key])
    // values.push(keyValueMap[key])
  })
  actionUtilTrigger(actions, formGroup, keys, actionId)
}

/** trigger onChange events & validation & watch */
function actionUtilTrigger (actions: ActionsT, formGroup: FormGroup, key: string|string[], actionId: string) {
  // TODO: 触发 onChange 事件 吗？
  // 触发 watch
  actionUtilTriggerWatch(actions, formGroup, key, actionId)
  // 触发 validation
  actionUtilTriggerValidation(actions, key)

  // TODO: nextTick 执行 tasks
}


/** 触发 watch */
function actionUtilTriggerWatch (actions: ActionsT, formGroup: FormGroup, key: string|string[], actionId: string) {
  const watchers = formGroup.fieldWatchers(key)
  watchers.forEach(watcher => {
    actions._taskManager.add(() => watcher.handler(...watcher.values, { actionId, key, formGroup }))
  })
}

/** 触发 validation */
function actionUtilTriggerValidation (actions: ActionsT, key: string|string[]) {
  actions._taskManager.add(() => actions.validate(key, { ignoreRequired: false, validatorMap: {} })) // TODO: 注册 validatorMap
}

type ActionValidateResultT = [string|string[], string][]

/** 验证 => Promise<[key|key[], message][]> */
async function actionValidate (
  actions: ActionsT,
  formGroup: FormGroup,
  key: null|string|string[],
  validatorOptions: ValidateOptions): Promise<ActionValidateResultT> {
  const commonProps: FormCommonPropsT = { formGroup, readonly: false, disabled: false }
  createMemoPropsGetter(commonProps)

  const validateSingle = async (f: FieldPropsT): Promise<ActionValidateResultT> => {
    try {
      await validateField(f.validators, f.value, f.key);
      actions.deleteError(f.key);
      return []
    }
    catch (message) {
      console.log('err message', f.key, message);
      actions.setError(f.key, message);
      return [[f.key, message]];
    }
  }

  const validateCombines = async (combines: ValidateCombine[], parallel = true): Promise<ActionValidateResultT> => {
    const validateCombine = async (combine: ValidateCombine): Promise<ActionValidateResultT> => {
      try {
        await validateFields([combine.validator], combine.values);
        for (const key of combine.validator[0]) {
          actions.deleteError(key);
        }
        return [];
      }
      catch (message) {
        console.log('err messge multi', combine.validator[0], message);
        for (const key_2 of combine.validator[0]) {
          actions.setError(key_2, message);
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

  if (typeof key === 'string') {
    // 验证 单个 字段
    const field = formGroup.field(key)
    if (!field) {
      // 找不到 Field
      return []
    }
    const fieldProps = commonProps.propsGetter!(field)

    const combines = formGroup.fieldValidators(key)

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
    const combines = formGroup.fieldValidators(key) // key is null|string[]
    const fieldPropsArr = formGroup.fields(key).filter(f => f).map(f => commonProps.propsGetter!(f!))
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