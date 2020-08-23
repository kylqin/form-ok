import { FieldDefineT } from '@/core/types'

export const  fields: FieldDefineT[] = [
  // { key: 'k1',  title: 'K1', validators: [(val: string) => ({ valid: val.startsWith('bo'), message: '要bo开头' })], 'c:hidden': g => g['k1'].startsWith('bo') },
  { key: 'k2',  title: 'K2', disabled: true },
  { key: 'k3',  title: 'K3', tooltip: '这是一个完美的の没有bug的tooltip' },
  { key: 'k4',  title: 'K4', required: true },
  { key: 'k8',  title: 'K8', span: 2 },
  { key: 'k9',  title: 'K9', hidden: true },
  { key: 'k10',  title: 'K10', readonly: true },
  { key: 'k11',  title: 'K11' },
  { key: 'k12',  title: 'K12' },
  { key: 'k13',  title: 'K13' },
]