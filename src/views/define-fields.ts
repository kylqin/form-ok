import { FieldDefineT } from '/@/core/types'
import { WatcherDefineT, FormGroup } from '../core/form-group'

export const  fields: FieldDefineT[] = [
  // { key: 'k1',  title: 'K1', validators: [(val: string) => ({ valid: val.startsWith('bo'), message: '要bo开头' })], 'c:hidden': g => g['k1'].startsWith('bo') },
  // { key: 'arr', widget: 'array', title: 'Array', properties: [
  //   { key: 'kk2',  title: 'KK2', validators: [v => ({ valid: v !== '2', message: '不能是2' })] },
  //   { key: 'kk3',  title: 'KK3', 'c:tooltip': g => g['.kk2'] === 'kk2' ? '这是一个完美的の没有bug的tooltip' : '' },
  //   { key: 'kk4',  title: 'KK4'  },
  // ]},
  { key: 'obj', widget: 'object', title: 'Object', properties: [
    { key: 'k2',  title: 'K2', validators: [v => ({ valid: v !== '2', message: '不能是2' })] },
    { key: 'k3',  title: 'K3', tooltip: '这是一个完美的の没有bug的tooltip' },
  ]},
  // { widget: 'group', title: 'Group', properties: [
  //   { key: 'k4',  title: 'K4', required: true },
  //   { key: 'k8',  title: 'K8', span: 2 },
  // ]},

  { key: 'k2',  title: 'K2', validators: [v => ({ valid: v !== '2', message: '不能是2' })] },
  { key: 'k3',  title: 'K3' },
  { key: 'k4',  title: 'K4'  },
  // { key: 'k9',  title: 'K9', hidden: true },
  // { key: 'k10',  title: 'K10', readonly: true },
  // { key: 'k11',  title: 'K11', 'c:tooltip': g => g['k12'] === 'k12' ? 'tooltip show when k12 === k12' : '' },
  { key: 'k11',  title: 'K11', 'c:tooltip': [['k12'], k12 => { console.log('c:toolitip k11', k12); return k12 === 'k11' ? 'tooltip show when k12 === k12' : '' }] },
  { key: 'k12',  title: 'K12' },
  { key: 'k13',  title: 'K13', 'c:disabled': [['k12'], k12 => { console.log('c:disabled k13', k12); return k12 === 'k13' }] },
]

export const watch: WatcherDefineT[] = [
  [['k3', 'k4'], (k3, k4, wOptions) => {
    console.log(k3, k4, wOptions)
    if (k3 === 'k3') {
      (wOptions.formGroup as FormGroup).actions.changeField('k2', '2')
    } else {
      (wOptions.formGroup as FormGroup).actions.changeField('k2', '8')
    }
  }]
]

export const initialData = {
  arr: [
    { kk2: 2 }
  ],
  obj: { k2: 'haha' },
  k10: '~~K10',
  k11: 'lock',
  k12: 'k11'
}