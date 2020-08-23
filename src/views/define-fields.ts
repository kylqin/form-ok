import { FieldDefineT } from '@/core/types'
import { WatcherDefineT, FormGroup } from '../core/form-group'

export const  fields: FieldDefineT[] = [
  // { key: 'k1',  title: 'K1', validators: [(val: string) => ({ valid: val.startsWith('bo'), message: '要bo开头' })], 'c:hidden': g => g['k1'].startsWith('bo') },
  { widget: 'box', title: 'box', properties: [
    { key: 'k2',  title: 'K2', validators: [v => ({ valid: v !== '2', message: '不能是2' })] },
    { key: 'k3',  title: 'K3', tooltip: '这是一个完美的の没有bug的tooltip' },
  ]},
  { key: 'k4',  title: 'K4', required: true },
  { key: 'k8',  title: 'K8', span: 2 },
  { key: 'k9',  title: 'K9', hidden: true },
  { key: 'k10',  title: 'K10', readonly: true },
  { key: 'k11',  title: 'K11' },
  { key: 'k12',  title: 'K12' },
  { key: 'k13',  title: 'K13', disabled: true },
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