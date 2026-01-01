import { createQBOContext } from '../utils/createQBOContext'
import { TaxCode } from '../types'

const { Provider, useContext: useTaxCodeContext } = createQBOContext<TaxCode>({
  endpoint: '/taxcodes',
  dataKey: 'TaxCode',
  contextName: 'TaxCode'
})

export const TaxCodeProvider = Provider
export const useTaxCode = useTaxCodeContext
