import { createQBOContext } from '../utils/createQBOContext'
import { TaxRate } from '../types'

const { Provider, useContext: useTaxRateContext } = createQBOContext<TaxRate>({
  endpoint: '/taxrates',
  dataKey: 'TaxRate',
  contextName: 'TaxRate'
})

export const TaxRateProvider = Provider
export const useTaxRate = useTaxRateContext
