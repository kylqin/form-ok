import { MinusCircleFilled, PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import React, { useMemo, useState } from 'react'
import { FormCommonPropsExtT, renderCtrls } from '../input-set'
import { ContentBox } from './content-box'
import { FieldPropsT } from '/@/core/types'
import { genID } from '/@/core/utils'

const createArrayItemId = () => genID('_arr_item_')

const insert = (arr: any[], idx: number, val: any) => arr.slice(0, idx).concat([val]).concat(arr.slice(idx))
const remove = (arr: any[], idx: number) => arr.slice(0, idx).concat(arr.slice(idx + 1))
const push = (arr: any[], val: any) => arr.concat([val])

type ArrayActions = {
  insert: (idx: number) => void,
  remove: (idx: number) => void,
  push: () => void
}

function useArrayIds (count: number): [string[], ArrayActions] {
  const [initialized, setInitialized] = useState(false)
  const [ids, setIds] = useState<string[]>(initialized || setInitialized(true) || new Array(count).fill(true).map(() => createArrayItemId()))
  const actions = useMemo(() => {
    return {
      insert: (idx: number) => { setIds((ids: string[]) => insert(ids, idx, createArrayItemId())) },
      remove: (idx: number) => { setIds((ids: string[]) => remove(ids, idx)) },
      push: () => { setIds((ids: string[]) => push(ids, createArrayItemId())) },
    }
  },
  [])

  return [ids, actions]
}

export const ArrayWidget = (props: { field: FieldPropsT, commonProps: FormCommonPropsExtT }) => {
  const { value, hidden, path, title } = props.field
  const { commonProps } = props

  const [ids, idsActions] = useArrayIds((value || []).length)
  console.log(ids)

  const valueActions: ArrayActions = useMemo(() => {
    return {
      insert: (index: number) => {},
      remove: (index: number) => {
        const { Form } = commonProps
        const arr = (Form.field(path!)!.value || []) as any[]
        Form.actions.changeField(path!, remove(arr, index), 'arr')
      },
      push: () => {}
    }
  }, [])

  if (hidden) { return <div /> }

  return <div key={path} className='fok-form-item-combination fok-form-item-combination-box'>
    <ContentBox title={title}>
      {ids.map((id: string, idx: number) =>
        <ArrayItemWidget arrField={props.field} commonProps={commonProps} id={id} index={idx} key={id} removeItem={() => { idsActions.remove(idx); valueActions.remove(idx) }}/>
      )}
      <Button type='dashed' block icon={<PlusOutlined />} onClick={() => idsActions.push()} />
    </ContentBox>
  </div>
}

const ArrayItemWidget = (props: { arrField: FieldPropsT, commonProps: FormCommonPropsExtT, id: string, index: number, removeItem: () => void }) => {
  const { path, properties } = props.arrField
  const { commonProps, index, removeItem } = props
  const jointer = '[' + index + '].'
  const _properties = properties!.map(propField => {
    const newPath = path + jointer + propField.defineKey
    const newPropField = commonProps.Form.field(newPath)!
    return newPropField
  })

  return <div className='fok-form-item-array' date-key={path + jointer}>
    {renderCtrls(_properties, commonProps)}
    <MinusCircleFilled className='fok-form-item-array-item-remove' onClick={removeItem}/>
  </div>
}