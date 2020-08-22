import { FieldDefineT } from '@/core/types'

export const  fields: FieldDefineT[] = [
  { key: 'k1',  title: 'K1', validators: [(val: string) => ({ valid: val.startsWith('bo'), message: '要bo开头' })], 'c:hidden': g => g['k1'].startsWith('bo') },
  { key: 'k2',  title: 'K2' },
  { key: 'k3',  title: 'K3' },
  { key: 'k4',  title: 'K4', required: true }
]