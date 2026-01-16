import { createQBOContext } from '../utils/createQBOContext'
import { PaymentMethodType } from '../types'

const { Provider, useContext: usePaymentMethodContext } = createQBOContext<PaymentMethodType>({
  endpoint: '/paymentmethods',
  dataKey: 'PaymentMethod',
  contextName: 'PaymentMethod'
})

export const PaymentMethodProvider = Provider
export const usePaymentMethod = usePaymentMethodContext
