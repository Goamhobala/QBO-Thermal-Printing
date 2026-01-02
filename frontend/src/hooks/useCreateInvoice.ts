import { useState, useMemo } from 'react'
import { useInvoice, useTaxCode } from '../contexts'
import { InvoiceFormData } from '../types'

interface CreateInvoicePayload {
  DocNumber?: string
  CustomerRef: {
    value: string
    name: string
  }
  Line: Array<{
    DetailType: 'SalesItemLineDetail'
    Amount: number
    Description?: string
    SalesItemLineDetail: {
      ItemRef: {
        value: string
        name: string
      }
      Qty: number
      UnitPrice: number
      TaxCodeRef?: {
        value: string
      }
    }
  }>
  TxnDate?: string
  DueDate?: string
  CustomerMemo?: {
    value: string
  }
  PrivateNote?: string
}

export const useCreateInvoice = () => {
  const { refetch } = useInvoice()
  const { data: taxCodes } = useTaxCode()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Log tax codes when they load
  useMemo(() => {
    console.log('[useCreateInvoice] Tax codes loaded:', {
      count: taxCodes.length,
      codes: taxCodes
    })
  }, [taxCodes])

  const createInvoice = async (formData: InvoiceFormData) => {
    if (!formData.customer) {
      setError('Customer is required')
      return null
    }

    if (formData.lineItems.length === 0) {
      setError('At least one line item is required')
      return null
    }

    // Validate that all line items have a tax rate selected
    const itemsWithoutTax = formData.lineItems.filter(item => !item.taxRateId)
    if (itemsWithoutTax.length > 0) {
      setError('All line items must have a tax rate selected.')
      console.error('Line items missing tax rate:', itemsWithoutTax)
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // Transform form data to QBO format
      const payload: CreateInvoicePayload = {
        CustomerRef: {
          value: formData.customer.Id,
          name: formData.customer.DisplayName
        },
        Line: formData.lineItems.map(item => ({
          DetailType: 'SalesItemLineDetail' as const,
          Amount: item.amount,
          Description: item.description || undefined,
          SalesItemLineDetail: {
            ItemRef: {
              value: item.itemId || '1', // Fallback to default item if not selected
              name: item.productName
            },
            Qty: item.quantity,
            UnitPrice: item.rate,
            TaxCodeRef: item.taxRateId ? {
              value: item.taxRateId // Use the tax rate selected for this line item
            } : undefined
          }
        })),
        TxnDate: formData.invoiceDate,
        DueDate: formData.dueDate
      }

      // Add optional fields
      if (formData.invoiceNo) {
        payload.DocNumber = formData.invoiceNo
      }

      if (formData.noteToCustomer) {
        payload.CustomerMemo = {
          value: formData.noteToCustomer
        }
      }

      if (formData.memoOnStatement) {
        payload.PrivateNote = formData.memoOnStatement
      }

      console.log('Creating invoice with payload:', payload)

      const response = await fetch('/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        let errorMessage = `Failed to create invoice: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If JSON parsing fails, use the response text
          const errorText = await response.text()
          if (errorText) errorMessage = errorText
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Invoice created successfully:', data)

      // Refresh the invoice list
      await refetch()

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invoice'
      setError(errorMessage)
      console.error('Error creating invoice:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createInvoice, loading, error }
}
