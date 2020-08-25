import { FormGroup, createFormGroup } from "../core/form-group";
import { ActionsT } from "../core/actions";
import { FokValidateResult } from "../core/validation";

const fg = createFormGroup({
  fields: [
    { path: 'k1',  title: 'K1', validators: [(val: string) => ({ valid: val.startsWith('bo'), message: '要bo开头' })], 'c:hidden': g => g['k1'].startsWith('bo') },
    { path: 'k2',  title: 'K2' },
    { path: 'k3',  title: 'K3' },
    { path: 'k4',  title: 'K4', required: true }
  ],
  validators: [
    [['k1', 'k2'], (k1, k2) => {
      const vr: FokValidateResult = {
        valid: k1 != k2,
      }
      if (!vr.valid) {
        vr.message = 'k1 should not equal to k2';
      }
      // console.log('vr ->', vr)
      return vr
    }],
    [['k3', 'k2'], (k3, k2) => {
      const vr: FokValidateResult = {
        valid: k3 == k2,
      }
      if (!vr.valid) {
        vr.message = 'k3 should === to k2';
      }
      // console.log('vr ->', vr)
      return vr
    }]
  ],
  watch: [
    [['k1', 'k2'], (k1, k2, { key, formGroup, actionId }) => {
      console.log(k1, k2, key, actionId)

      console.log('changeCount ->', changeCount)
      if (actionId === 'self-change') {
        return
      }

      if (changeCount < 10) {
        actions.changeField('k2', 'mmm' + changeCount, 'self-change')
        Promise.resolve().then(() => {
          actions._taskManager.run()
        })
      }
      changeCount += 1
    }]
  ]
}, {
  k1: 'hello'
})

let changeCount = 0

// console.log('fg.data', fg.data)

const actions = new ActionsT(fg)

actions.changeField('k1', 'bkook', 'cf1')
// actions.changeField('k2', 'mama', 'cf1')

// console.log('fg.data', fg.data)

// console.log(actions._taskManager)

actions._taskManager.run()

// actions.changeField('k2', 'book', 'cf2')

setTimeout(() => {
  actions._taskManager.run()
}, 1000)