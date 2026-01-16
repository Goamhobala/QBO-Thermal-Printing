import { createQBOContext } from '../utils/createQBOContext'
import { AccountType } from '../types'

const { Provider, useContext: useAccountContext } = createQBOContext<AccountType>({
  endpoint: '/accounts',
  dataKey: 'Account',
  contextName: 'Account'
})

export const AccountProvider = Provider
export const useAccount = useAccountContext
