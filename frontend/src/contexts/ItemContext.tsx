import { createQBOContext } from '../utils/createQBOContext'
import { Item } from '../types'

const { Provider, useContext: useItemContext } = createQBOContext<Item>({
  endpoint: '/items',
  dataKey: 'Item',
  contextName: 'Item'
})

export const ItemProvider = Provider
export const useItem = useItemContext
