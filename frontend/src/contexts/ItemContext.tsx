import {createContext, useContext, useState, useCallback, ReactNode} from "react";
import {Item} from "../types";


interface ItemContextType{
    items: Item[]
    loading: boolean
    error: string | null
    fetchItems: () => Promise<void>
    refetch: () => Promise<void>
}

const ItemContext = createContext<ItemContextType | undefined>(undefined);


export const ItemProvider = ({children}: {children: ReactNode}) => {
    const [items, setItems] = useState<Item[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasFetched, setHasFetched] = useState(false)

    const fetchItems = useCallback(async () => {
        if (hasFetched && items.length > 0){
            // Returned if fetched already
            return
        }
        setLoading(true)
        setError(null)
        try{
            const response = await fetch('/items');
            if (!response.ok){
                throw new Error(`Failed while fetching items: ${response.statusText}`)
            }
            const data = await response.json()
            const itemData = data.QueryResponse.Item || []
            setItems(itemData)
            setHasFetched(true)
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch items'
            setError(errorMessage)
            console.error('Error fetching items:', err)
        } finally {
            setLoading(false)
        }


    }, [hasFetched])

      // Force refetch regardless of cache
    const refetch = useCallback(async () => {
      setHasFetched(false)
      setItems([])
      await fetchItems()
    }, [fetchItems])
  
    return (
        <ItemContext.Provider
            value={{
                items,
                loading,
                error,
                fetchItems,
                refetch
            }}
        >
            {children}
        </ItemContext.Provider>
    )
}

export const useItem = () => {
    const context = useContext(ItemContext)
    if (!context) {
        throw new Error('useItem must be used within an ItemProvider')
    }
    return context
}
