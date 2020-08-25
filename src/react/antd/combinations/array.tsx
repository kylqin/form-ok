import React, { useMemo, useState } from 'react'
import { FormCommonPropsExtT, renderCtrls } from '../input-set'
import { ContentBox } from './content-box'
import { FieldPropsT } from '/@/core/types'
import { genID } from '/@/core/utils'

const createArrayItemId = () => genID('_arr_item_')

const insert = (arr: any[], idx: number, val: any) => arr.slice(0, idx).concat([val]).concat(arr.slice(idx))
const remove = (arr: any[], idx: number) => arr.slice(0, idx).concat(arr.slice(idx + 1))
const push = (arr: any[], val: any) => arr.concat([val])

function useArrayIds (count: number) {
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

  return [ids, actions, setIds]
}

export const ArrayWidget = (props: { field: FieldPropsT, commonProps: FormCommonPropsExtT }) => {
  const { value, readonly, disabled, hidden, path, title, properties } = props.field
  const { commonProps } = props

  const [valueArr, setValueArr] = useState(value || [])
  const [ids, idsActions, setIds] = useArrayIds(valueArr.length)
  console.log(ids, valueArr)

  const valueActions = useMemo(() => {
    return {
      insert: (index: number) => {},
      remove: (index: number) => {
        const { formGroup } = commonProps
        const arr = (formGroup.field(path!)!.value || []) as any[]
        // console.log('arr', arr, index)
        formGroup.actions.changeField(path!, remove(arr, index), 'arr')
      },
      push: () => {}
    }
  }, [])

  if (hidden) { return <div /> }

  return <div key={path} className='fok-form-item-combination fok-form-item-combination-box'>
    <ContentBox title={title}>
      {ids.map((id: string, idx: number) => <ArrayItemWidget arrField={props.field} commonProps={commonProps} id={id} index={idx} key={id} />)}
      <span onClick={() => idsActions.push()}>Add</span>
      <span onClick={() => idsActions.insert(2)}>Insert at 2</span>
      <span onClick={() => { idsActions.remove(0), valueActions.remove(0) }}>Remove at 0</span>
    </ContentBox>
  </div>
}

const ArrayItemWidget = (props: { arrField: FieldPropsT, commonProps: FormCommonPropsExtT, id: string, index: number }) => {
  const { readonly, disabled, hidden, path, title, properties } = props.arrField
  const { commonProps, id, index } = props
  const jointer = '[' + index + '].'
  const _properties = properties!.map(propField => {
    const newPath = path + jointer + propField.defineKey
    const newPropField = commonProps.formGroup.field(newPath)!
    return newPropField
  })
  // console.log('_properties ->', _properties)

  return <div className='' style={{ display: 'flex', flexWrap: 'wrap' }} date-key={path + jointer}>
    {id}
    {renderCtrls(_properties, commonProps)}
  </div>
}