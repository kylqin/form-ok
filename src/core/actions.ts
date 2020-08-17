import * as _ from 'lodash'
import { FormGroup } from './form-group';
import { TaskManager } from './task-manager';
import { PlainObject, FieldDefineT } from './types';
import { ValidateOptions } from './validation';

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

  validate (key: null|string|string[], validateOptions: ValidateOptions) {}

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