import { createQBOContext } from '../utils/createQBOContext'
import { Term } from '../types'

const { Provider, useContext: useTermContext } = createQBOContext<Term>({
  endpoint: '/terms',
  dataKey: 'Term',
  contextName: 'Term'
})

export const TermProvider = Provider
export const useTerm = useTermContext
