import _ from 'lodash'

export type FokValidateResult = {
  valid: boolean,
  message?: string
}

export type FokValidatorT = (value: any) => FokValidateResult
export type AsyncValidatorT = (value: any) => Promise<FokValidateResult>
export type AsyncValidatorDeifneT = {
  type: 'async'
  exec: AsyncValidatorT
}

export type MultiValidatorT = [string[], (...values: any[]) => FokValidateResult, string?]
export type AsyncMultiValidatorT = [string[], (...values: any[]) => Promise<FokValidateResult>, 'async']

export type FokValidatorDefineT = (string|FokValidatorT|AsyncValidatorDeifneT)
export type MultiValidatorDefineT = (MultiValidatorT|AsyncMultiValidatorT)

export type ValidateCombine = {
  validator: MultiValidatorDefineT,
  values: any[]
}

// type PenddingAsyncValidatorT = { path: string, exec: AsyncValidatorT }

/** Async Validation */
// const AsyncValidators = {
//   current: [],
//   clear: () => { AsyncValidators.current = [] },
//   add: (asyncValidator: AsyncValidatorT, path: string) => {
//     // 替换重复的 path
//     _.remove(AsyncValidators.current, v => v.path === path)
//     AsyncValidators.current.push({ path, exec: asyncValidator })
//   },
//   validate: () => {
//     const current = AsyncValidators.current
//     AsyncValidators.clear()
//     return Promise.all(current.map(v => v.exec()))
//   }
// }

export type ValidateOptions = {
  ignoreRequired: boolean,
  validatorMap: {
    [path: string]: FokValidatorT
  }
}

const defaultValidateOptions = { ignoreRequired: false, validatorMap: {} }

/** Validate a single Field */
export function validateField (validators: FokValidatorDefineT[], value: any, path: string, validateOptions: ValidateOptions = defaultValidateOptions)
  : Promise<string> {
    console.log('validate Field ->', path, value)
  //是否必填
  const _validators = validators.filter(v => v !== 'required')
  const required = _validators.length < validators.length

  const isEmpty = !value || /^\s*$/.test(value)

  if (isEmpty) {
    if (required) {
      return Promise.reject('Field is empty')
    } else {
      return Promise.resolve('')
    }
  }

  const { validatorMap } = validateOptions
  return new Promise((resolve, reject) => {
    let message: string = ''
    const asyncValidators = []

    for (let [idx, validator] of _validators.entries()) {
      if (typeof validator === 'object') {
        if (validator.type === 'async') {
          // 异步验证
          asyncValidators.push(validator)
        }
      }

      if (typeof validator === 'string') {
        validator = validatorMap[validator]
      }
      if (!validator) {
        throw Error(`Invalid validator Item ${idx} for Field ${path}`)
      }


      if (typeof validator === 'function') {
        const vr = (validator as FokValidatorT)(value)
        if (!vr.valid) {
          message = vr.message!
          break
        }
      }
    } // end of for

    if (message) {
      // 同步验证不通过
      reject(message)
    } else {
      // 同步验证通过
      if (asyncValidators.length) {
        // 有则执行异步验证
        return Promise.all(asyncValidators.map(v => v.exec(value)))
          .then(vrs => {
            message = vrs.map(vr => vr.valid ? '' : vr.message).join(';')
            return message ? Promise.reject(message) : Promise.resolve('')
          })
      } else {
        // 无，则表示所有验证都通过
        resolve('')
      }
    }
  })
}

/** Validate multiple Fields */
export function validateFields (validators: MultiValidatorDefineT[], values: any[], validateOptions: ValidateOptions = defaultValidateOptions): Promise<string> {
  console.log('validate Field ->', validators.map(v => v[0]), values)
  return new Promise((reslove, reject) => {
    let message: string = ''
    let asyncValidators = []
    for (const validatorDefine of validators) {
      const [paths, validator, type] = validatorDefine
      if (type === 'async') {
        // 异步验证
        asyncValidators.push(validator)
      }

      // 同步验证
      const vr = validator(...values) as FokValidateResult
      if (!vr.valid) {
        message = vr.message!
        break
      }
    } // end of for

    if (message) {
      // 同步验证不通过
      reject(message)
    } else {
      // 同步验证通过
      if (asyncValidators.length) {
        // 有则执行异步验证
        return Promise.all(asyncValidators.map(v => v(...values)))
          .then(vrs => {
            message = vrs.map(vr => vr.valid ? '' : vr.message).join(';')
            return message ? Promise.reject(message) : Promise.resolve('')
          })
      } else {
        // 无，则表示所有验证都通过
        reslove('')
      }
    }
  })
}

/** 触发 form 验证 */
export async function triggerValidations (
  formGroup: any,
  validate: (fromGroup: any, validateOptions: ValidateOptions) => FokValidateResult,
  validateOptions: ValidateOptions = defaultValidateOptions
): Promise<FokValidateResult> {
  const formGroups = Array.isArray(formGroup) ? formGroup : [formGroup]
  let errors = await Promise.all(formGroups.map(group => {
    group.actions.clearErrors();
      return group.actions.validate(null, validateOptions);
  }))

  errors = _.flatten(errors).filter(r => r)

  console.log('errors ->', errors)
  if (errors.length) {
    return {
      valid: false,
      // message: '',
      message: JSON.stringify(errors)
    };
  }
  return validate(formGroup, validateOptions)
}