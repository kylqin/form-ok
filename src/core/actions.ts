import * as _ from 'lodash'
import { FormGroup } from './form-group';
import { TaskManager } from './task-manager';
import { PlainObject, FieldDefineT } from './types';
import { ValidateOptions } from './validation';

export class ActionsT {
  private _taskManager = new TaskManager()

  constructor (private formGroup: FormGroup) {}

  init (data: PlainObject) {}

  newField (field: FieldDefineT) {}

  changeField (key: string, value: any, actionId: string) {}

  changeFields (changeMap: PlainObject, actionId: string) {}

  deleteFeild (key: string) {}

  setError (key: string, message: string) {}

  deleteError (key: string) {}

  clearErrors () {}

  submit (type: 'validate|ignoreRequired|force') {}
  submitDone () {}

  validate (key: string, validateOptions: ValidateOptions) {}

  // _triggerWatch
  // _triggerWatchMulti
}