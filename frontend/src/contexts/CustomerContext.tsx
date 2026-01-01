import { createQBOContext } from '../utils/createQBOContext'
import { Customer } from '../types'

const { Provider, useContext: useCustomerContext } = createQBOContext<Customer>({
  endpoint: '/customers',
  dataKey: 'Customer',
  contextName: 'Customer'
})

export const CustomerProvider = Provider
export const useCustomer = useCustomerContext
