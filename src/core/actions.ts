import { createMemoPropsGetter, FormCommonPropsT } from './fields';
import { Form } from './form';
import { TaskManager } from './task-manager';
import { FieldDefineT, FieldExtT, FieldPropsT } from './types';
import { PlainObject } from './utils';
import { ValidateCombine, validateField, validateFields, ValidateOptions } from './validation';

export class ActionsT {
  public _taskManager = new TaskManager()

  constructor (private Form: Form) {}

  init (data: PlainObject) {}

  newField (field: FieldDefineT) {}

  changeField (path: string, value: any, actionId?: string) {
    console.log('changeField ->', path, value, actionId)
    actionChangeField(this, this.Form, path, value, actionId)
  }

  changeFields (changeMap: PlainObject, actionId?: string) {
    actionChangeFields(this, this.Form, changeMap, actionId)
  }

  deleteFeild (path: string) {}

  setError (path: string, message: string) {
    console.log('setError ->', path, message)
    this.Form.updateField(path, (field: FieldExtT) => {
      field.errors = [{ message: message }]
    })
  }

  deleteError (path: string) {
    this.Form.updateField(path, (field: FieldExtT) => {
      field.errors = []
    })
  }

  clearErrors () {}

  submit (type: 'validate|ignoreRequired|force') {}
  submitDone () {}

  validate (path: null|string|string[], validateOptions: ValidateOptions) {
    return actionValidate(this, this.Form, path, validateOptions)
  }
}

/** initial data */
function actionInit (actions: ActionsT, Form: Form, data: PlainObject) {
  Form.data = data
}

/** new field */
function actionNewField (actions: ActionsT, Form: Form, field: FieldDefineT) {
  // TODO: 合并到 Form 现有的 fieldSchema 和 fieldMap 中
}

/** changeField 改变 field 的 value 值 */
function actionChangeField (actions: ActionsT, Form: Form, path: string, value: any, actionId?: string) {
  // 改变 data
  Form.updateData(path, value)
  Form.updateField(path, field => {
    field.markNeedSyncValue()
    Form.eventBus.dispatchValueUpdate(path)
  })

  actionUtilTrigger(actions, Form, path, actionId)
}

/** changeFields 根据 pathValueMap 改变 field 的 value */
function actionChangeFields (actions: ActionsT, Form: Form, pathValueMap: PlainObject, actionId?: string) {
  const paths = Object.keys(pathValueMap)
  // const values = []
  // 改变 data
  paths.forEach(path => {
    Form.updateData(path, pathValueMap[path])
    Form.updateField(path, field => {
      field.markNeedSyncValue()
      Form.eventBus.dispatchValueUpdate(path)
    })
  })
  actionUtilTrigger(actions, Form, paths, actionId)
}

/** trigger onChange events & validation & watch & compute */
function actionUtilTrigger (actions: ActionsT, Form: Form, path: string|string[], actionId?: string) {
  // TODO: 触发 onChange 事件 吗？
  // 触发 watch
  actionUtilTriggerWatch(actions, Form, path, actionId)
  // 触发 validation
  actionUtilTriggerValidation(actions, path)
  // 触发 compute
  actionUtilTriggerCompute(actions, Form, path, actionId)

  // TODO: nextTick 执行 tasks
  Promise.resolve().then(() => {
    // console.log(actions._taskManager)
    actions._taskManager.run()
  }).then(() => {
    Form.fields().forEach(field => {
      if (field!.propsDirty) {
        Form.eventBus.dispatchPropsUpdate(field!.path)
      }
    })
  })
}

/** 触发 watch */
function actionUtilTriggerWatch (actions: ActionsT, Form: Form, path: string|string[], actionId?: string) {
  const watchers = Form.fieldWatchers(path)
  watchers.forEach(watcher => {
    actions._taskManager.add(() => watcher.handler(...watcher.values, { actionId, path, Form }))
  })
}

/** 触发 validation */
function actionUtilTriggerValidation (actions: ActionsT, path: string|string[]) {
  actions._taskManager.add(() => actions.validate(path, { ignoreRequired: false, validatorMap: {} })) // TODO: 注册 validatorMap
}

/** 触发 watch */
function actionUtilTriggerCompute (actions: ActionsT, Form: Form, path: string|string[], actionId?: string) {
  const computes = Form.fieldComputes(path)
  computes.forEach(compute => {
    actions._taskManager.add(() => {
      const [path, prop] = compute.pathProp.split(':')
      Form.updateComputed(path, prop, compute.handler(...compute.values, { actionId, path, Form }))
    })
  })
}

type ActionValidateResultT = [string|string[], string][]


const validateSingle = async (actions: ActionsT, field: FieldPropsT): Promise<ActionValidateResultT> => {
  try {
    await validateField(field.validators, field.value, field.path);
    actions.deleteError(field.path);
    return []
  }
  catch (message) {
    console.log('err message', field.path, message);
    actions.setError(field.path, message);
    return [[field.path, message]];
  }
}

const validateCombines = async (actions: ActionsT, combines: ValidateCombine[], parallel = true): Promise<ActionValidateResultT> => {
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
      for (const path of combine.validator[0]) {
        actions.setError(path, message);
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

/** 验证 => Promise<[path|path[], message][]> */
async function actionValidate (
  actions: ActionsT,
  Form: Form,
  path: null|string|string[],
  validatorOptions: ValidateOptions): Promise<ActionValidateResultT> {
  const commonProps: FormCommonPropsT = { Form, readonly: false, disabled: false }
  createMemoPropsGetter(commonProps)

  // console.log('commonProps ->', commonProps)

  if (typeof path === 'string') {
    // 验证 单个 字段
    const field = Form.field(path)
    if (!field) {
      // 找不到 Field
      return []
    }
    const fieldProps = commonProps.propsGetter!(field)

    const combines = Form.fieldValidators(path)

    if (!combines.length) {
      // 如果没有 组合 验证, 则只执行 Field 自己的验证器
      return await validateSingle(actions, fieldProps)
    } else {
      // 否则，还要执行组合验证器
      let validateResult = await validateSingle(actions, fieldProps)
      if (validateResult) {
        return validateResult
      } else {
        return await validateCombines(actions, combines, false) // 懒惰验证，遇到失败就返回
      }
    }
  } else {
    // 验证 多个字段 / 所有字段
    const combines = Form.fieldValidators(path) // path is null|string[]
    const fieldPropsArr = Form.fields(path).filter(f => f).map(f => commonProps.propsGetter!(f!))
    const validateSingelsResult = await Promise.all(fieldPropsArr.map(f => validateSingle(actions, f)))
        .then(errors => errors.filter(e => e.length).flatMap(e => e))
    if (combines.length) {
      // 如果没有组合验证器, 只执行所有的单字段验证器
      return validateSingelsResult
    } else {
      const validateCombinesResult = await validateCombines(actions, combines)
      return validateCombinesResult.concat(validateCombinesResult)
    }
  }
}