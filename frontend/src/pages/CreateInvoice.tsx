import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LineItem, InvoiceFormData } from '../types'
import { useCustomer, useItem, useTaxCode, useInvoice } from '../contexts'
import { useCreateInvoice } from '../hooks/useCreateInvoice'
import Input from '../components/Input'
import Select from '../components/Select'
import Button from '../components/Button'
import Textarea from '../components/Textarea'
import { ItemCombobox } from '../components/ItemCombobox'


const CreateInvoice = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)

  const { data: customers, loading: customersLoading, error: customersError, fetchData: fetchCustomers } = useCustomer()
  const { data: items, loading: itemsLoading, error: itemsError, fetchData: fetchItems } = useItem()
  const { data: taxCodes, loading: taxCodesLoading, error: taxCodesError, fetchData: fetchTaxCodes } = useTaxCode()
  const { data: invoices } = useInvoice()
  const { createInvoice, loading: createLoading, error: createError } = useCreateInvoice()

  // Filter to only show active, non-hidden tax codes
  const availableTaxCodes = useMemo(() => {
    return taxCodes.filter(tc => tc.Active && !tc.Hidden)
  }, [taxCodes])

  // Calculate next invoice number
  const nextInvoiceNumber = useMemo(() => {
    if (invoices.length === 0) return '1'

    // Extract numeric invoice numbers and find the max
    const invoiceNumbers = invoices
      .map(inv => parseInt(inv.DocNumber))
      .filter(num => !isNaN(num))

    if (invoiceNumbers.length === 0) return '1'

    const maxNumber = Math.max(...invoiceNumbers)
    return String(maxNumber + 1)
  }, [invoices])

  const [formData, setFormData] = useState<InvoiceFormData>({
    customer: null,
    invoiceNo: "",
    terms: 'Net 30',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    poNumber: '',
    salesRep: '',
    tags: [],
    taxType: 'exclusive',
    lineItems: [],
    noteToCustomer: 'Thank you for your business.',
    memoOnStatement: ''
  })

  const [subtotal, setSubtotal] = useState(0)
  const [totalVat, setTotalVat] = useState(0)
  const [total, setTotal] = useState(0)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    fetchCustomers()
    fetchItems()
    fetchTaxCodes()
  }, [fetchCustomers, fetchItems, fetchTaxCodes])

  // Update invoice number when creating a new invoice
  useEffect(() => {
    if (!isEditMode && nextInvoiceNumber) {
      setFormData(prev => ({ ...prev, invoiceNo: nextInvoiceNumber }))
    }
  }, [isEditMode, nextInvoiceNumber])

  // Calculate due date based on terms
  useEffect(() => {
    if (formData.invoiceDate && formData.terms) {
      const date = new Date(formData.invoiceDate)
      const daysMatch = formData.terms.match(/\d+/)
      if (daysMatch) {
        const days = parseInt(daysMatch[0])
        date.setDate(date.getDate() + days)
        setFormData(prev => ({ ...prev, dueDate: date.toISOString().split('T')[0] }))
      }
    }
  }, [formData.invoiceDate, formData.terms])

  // Calculate totals
  useEffect(() => {
    const sub = formData.lineItems.reduce((sum, item) => sum + item.amount, 0)
    const vat = formData.lineItems.reduce((sum, item) => sum + item.vatAmount, 0)
    setSubtotal(sub)
    setTotalVat(vat)
    setTotal(sub + vat)
  }, [formData.lineItems])

  const addLineItem = () => {
    // Find default tax code (15% SA for South Africa)
    const defaultTaxCode = availableTaxCodes.find(tc =>
      tc.Name.toLowerCase().includes('sa') ||
      tc.Name.toLowerCase().includes('15') ||
      tc.Description?.toLowerCase().includes('south africa')
    )

    const newItem: LineItem = {
      id: Date.now().toString(),
      productName: '',
      sku: '',
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      vatAmount: 0,
      taxRateId: defaultTaxCode?.Id || availableTaxCodes[0]?.Id || undefined
    }
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem]
    }))
  }

  const removeLineItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id)
    }))
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }

          // If selecting a product from QBO items, populate fields
          if (field === 'itemId' && typeof value === 'string') {
            const selectedItem = items.find(i => i.Id === value)
            if (selectedItem) {
              updated.productName = selectedItem.Name
              updated.sku = selectedItem.Sku || ''
              updated.description = selectedItem.Description || ''
              updated.rate = selectedItem.UnitPrice || 0
            }
          }

          // Recalculate amount and VAT when quantity, rate, or tax rate changes
          if (field === 'quantity' || field === 'rate' || field === 'taxRateId') {
            const qty = field === 'quantity' ? Number(value) : item.quantity
            const rate = field === 'rate' ? Number(value) : item.rate
            const taxCodeId = field === 'taxRateId' ? String(value) : item.taxRateId

            updated.amount = qty * rate

            // Find the selected tax code and calculate VAT
            const selectedTaxCode = availableTaxCodes.find(tc => tc.Id === taxCodeId)
            if (selectedTaxCode) {
              // For South Africa, use 15% VAT (hardcoded for now)
              // TODO: Parse tax rate from SalesTaxRateList if needed
              const taxRateDecimal = 0.15 // 15% VAT
              updated.vatAmount = updated.amount * taxRateDecimal
            } else {
              updated.vatAmount = 0
            }
          }

          return updated
        }
        return item
      })
    }))
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }))
      }
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditMode) {
      // TODO: Implement update logic later
      console.log('Update invoice:', formData)
      return
    }

    // Create new invoice
    const result = await createInvoice(formData)

    if (result) {
      // Success! Navigate back to invoice list
      navigate('/invoices')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {customersError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Error loading customers</p>
          <p className="text-sm">{customersError}</p>
        </div>
      )}
      {itemsError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Error loading items</p>
          <p className="text-sm">{itemsError}</p>
        </div>
      )}
      {taxCodesError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Error loading tax codes</p>
          <p className="text-sm">{taxCodesError}</p>
        </div>
      )}
      {createError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Error creating invoice</p>
          <p className="text-sm">{createError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold text-gray-900">INVOICE</h1>
            <div className="text-right">
              <p className="text-sm text-gray-600">Balance due (Roden)</p>
              <p className="text-2xl font-bold text-gray-900">R{total.toFixed(2)}</p>
            </div>
          </div>

          {/* Customer and Invoice Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-4">
              <Select
                label="Customer"
                options={[
                  { value: '', label: 'Select a customer...' },
                  ...customers.map(c => ({
                    value: c.Id,
                    label: c.DisplayName
                  }))
                ]}
                value={formData.customer?.Id || ''}
                onChange={(e) => {
                  if (e.target.value === '') {
                    setFormData(prev => ({ ...prev, customer: null }))
                    return
                  }
                  const selectedCustomer = customers.find(c => c.Id === e.target.value)
                  if (selectedCustomer) {
                    setFormData(prev => ({ ...prev, customer: selectedCustomer }))
                  }
                }}
                disabled={customersLoading}
              />
              {customersLoading && <p className="text-sm text-gray-500">Loading customers...</p>}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Invoice no."
                  value={isEditMode ? formData.invoiceNo : nextInvoiceNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceNo: e.target.value }))}
                  disabled={!isEditMode}
                  placeholder={!isEditMode ? "Auto-generated" : ""}
                />
                <Select
                  label="Terms"
                  options={[
                    { value: 'Net 30', label: 'Net 30' },
                    { value: 'Net 15', label: 'Net 15' },
                    { value: 'Due on receipt', label: 'Due on receipt' }
                  ]}
                  value={formData.terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Invoice date"
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                />
                <Input
                  label="Due date"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* PO Number and Sales Rep */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
            <Input
              label="P.O. Number"
              placeholder="Purchase order number"
              value={formData.poNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
            />
            <Input
              label="Sales Rep"
              placeholder="Sales representative"
              value={formData.salesRep}
              onChange={(e) => setFormData(prev => ({ ...prev, salesRep: e.target.value }))}
            />
          </div>

          {/* Tags */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (hidden)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <Input
              placeholder="Start typing to add a tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
          </div>

          {/* Tax Type Toggle */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice amounts are (hidden)
            </label>
            <Select
              options={[
                { value: 'exclusive', label: 'Exclusive of Tax' },
                { value: 'inclusive', label: 'Inclusive of Tax' }
              ]}
              value={formData.taxType}
              onChange={(e) => setFormData(prev => ({ ...prev, taxType: e.target.value as 'exclusive' | 'inclusive' }))}
            />
          </div>
        </div>

        {/* Line Items Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Product or service</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Select Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product/service</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                  <th className="w-40 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Rate</th>
                  <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VAT</th>
                  <th className="w-12 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.lineItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      <ItemCombobox
                        items={items}
                        value={item.itemId}
                        onValueChange={(value) => updateLineItem(item.id, 'itemId', value)}
                        disabled={itemsLoading}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => updateLineItem(item.id, 'productName', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Product name"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.sku || ''}
                        onChange={(e) => updateLineItem(item.id, 'sku', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="SKU"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Description"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.taxRateId || ''}
                        onChange={(e) => updateLineItem(item.id, 'taxRateId', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        disabled={taxCodesLoading}
                      >
                        <option value="">Select tax code...</option>
                        {availableTaxCodes.map(taxCode => (
                          <option key={taxCode.Id} value={taxCode.Id}>
                            {taxCode.Name} - {taxCode.Description}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      R{item.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      R{item.vatAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addLineItem}
            >
              Add product or service
            </Button>
            {itemsLoading && <span className="ml-4 text-sm text-gray-500">Loading items...</span>}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Customer Options */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer payment options</h3>
              <Textarea
                label="Note to customer"
                value={formData.noteToCustomer}
                onChange={(e) => setFormData(prev => ({ ...prev, noteToCustomer: e.target.value }))}
                rows={3}
              />
              <div className="mt-4">
                <Textarea
                  label="Memo on statement (hidden)"
                  value={formData.memoOnStatement}
                  onChange={(e) => setFormData(prev => ({ ...prev, memoOnStatement: e.target.value }))}
                  rows={2}
                  placeholder="This memo will not show up on your invoice, but will appear on the statement."
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    multiple
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-blue-600 hover:text-blue-700"
                  >
                    Add attachment
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Max file size: 20 MB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Totals */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">R{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-gray-200 pb-3">
                <span className="text-gray-600">VAT @ 15%</span>
                <span className="font-medium">R{totalVat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Invoice total</span>
                <span>R{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={createLoading || customersLoading || itemsLoading || taxCodesLoading}
              >
                {createLoading ? 'Creating Invoice...' : isEditMode ? 'Update Invoice' : 'Create Invoice'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CreateInvoice
