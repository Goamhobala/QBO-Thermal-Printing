import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Customer } from '../types'

interface CustomerContextType {
  customers: Customer[]
  loading: boolean
  error: string | null
  fetchCustomers: () => Promise<void>
  refetch: () => Promise<void>
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(false)

  const fetchCustomers = useCallback(async () => {
    // If already fetched and we have data, don't fetch again
    if (hasFetched && customers.length > 0) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/customers')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.statusText}`)
      }

      const data = await response.json()
      const customerData = data.QueryResponse.Customer || []

      setCustomers(customerData)
      setHasFetched(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers'
      setError(errorMessage)
      console.error('Error fetching customers:', err)
    } finally {
      setLoading(false)
    }
  }, [hasFetched, customers.length])

  // Force refetch regardless of cache
  const refetch = useCallback(async () => {
    setHasFetched(false)
    setCustomers([])
    await fetchCustomers()
  }, [fetchCustomers])

  return (
    <CustomerContext.Provider
      value={{
        customers,
        loading,
        error,
        fetchCustomers,
        refetch
      }}
    >
      {children}
    </CustomerContext.Provider>
  )
}

export const useCustomer = () => {
  const context = useContext(CustomerContext)
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider')
  }
  return context
}
