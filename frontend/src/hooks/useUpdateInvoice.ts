import { useState } from 'react'
import { useInvoice } from '../contexts'
import { InvoiceFormData } from '../types'

export const useUpdateInvoice = () => {
  const { refetch } = useInvoice()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateInvoice = async (invoiceId: string, formData: InvoiceFormData) => {
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
      const payload = {
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
              value: item.itemId || '1',
              name: item.productName
            },
            Qty: item.quantity,
            UnitPrice: item.rate,
            TaxCodeRef: item.taxRateId ? {
              value: item.taxRateId
            } : undefined
          }
        })),
        TxnDate: formData.invoiceDate,
        DueDate: formData.dueDate,
        DocNumber: formData.invoiceNo || undefined,
        CustomerMemo: formData.noteToCustomer ? {
          value: formData.noteToCustomer
        } : undefined,
        PrivateNote: formData.memoOnStatement || undefined
      }

      console.log('Updating invoice with payload:', payload)

      const response = await fetch(`/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        let errorMessage = `Failed to update invoice: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          const errorText = await response.text()
          if (errorText) errorMessage = errorText
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Invoice updated successfully:', data)

      // Refresh the invoice list
      await refetch()

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update invoice'
      setError(errorMessage)
      console.error('Error updating invoice:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { updateInvoice, loading, error }
}
