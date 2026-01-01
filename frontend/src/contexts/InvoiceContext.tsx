import { createQBOContext } from '../utils/createQBOContext'
import { QBOInvoice } from '../types'

const { Provider, useContext: useInvoiceContext } = createQBOContext<QBOInvoice>({
  endpoint: '/invoices',
  dataKey: 'Invoice',
  contextName: 'Invoice'
})

export const InvoiceProvider = Provider
export const useInvoice = useInvoiceContext
