import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface QBOContextType<T> {
  data: T[]
  loading: boolean
  error: string | null
  fetchData: () => Promise<void>
  refetch: () => Promise<void>
}

interface CreateQBOContextOptions {
  endpoint: string
  dataKey: string
  contextName: string
}

export const createQBOContext = <T,>({ endpoint, dataKey, contextName }: CreateQBOContextOptions) => {
  const Context = createContext<QBOContextType<T> | undefined>(undefined)

  const Provider = ({ children }: { children: ReactNode }) => {
    const [data, setData] = useState<T[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasFetched, setHasFetched] = useState(false)

    const fetchData = useCallback(async () => {
      // If already fetched and we have data, don't fetch again
      if (hasFetched && data.length > 0) {
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(endpoint, {
          credentials: 'include' // Include cookies in the request
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch ${contextName}: ${response.statusText}`)
        }

        const responseData = await response.json()
        const items = responseData.QueryResponse[dataKey] || []

        setData(items)
        setHasFetched(true)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : `Failed to fetch ${contextName}`
        setError(errorMessage)
        console.error(`Error fetching ${contextName}:`, err)
      } finally {
        setLoading(false)
      }
    }, [hasFetched, data.length])

    // Force refetch regardless of cache
    const refetch = useCallback(async () => {
      setHasFetched(false)
      setData([])
      await fetchData()
    }, [fetchData])

    return (
      <Context.Provider
        value={{
          data,
          loading,
          error,
          fetchData,
          refetch
        }}
      >
        {children}
      </Context.Provider>
    )
  }

  const useContextHook = () => {
    const context = useContext(Context)
    if (context === undefined) {
      throw new Error(`use${contextName} must be used within a ${contextName}Provider`)
    }
    return context
  }

  return {
    Provider,
    useContext: useContextHook
  }
}
