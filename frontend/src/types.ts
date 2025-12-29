export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
}

export interface LineItem {
  id: string
  productName: string
  sku?: string
  description?: string
  quantity: number
  rate: number
  amount: number
  vatAmount: number
}

export interface Invoice {
  id?: string
  invoiceNo: string
  customer: Customer | null
  terms: string
  invoiceDate: string
  dueDate: string
  poNumber?: string
  salesRep?: string
  tags: string[]
  taxType: 'exclusive' | 'inclusive'
  lineItems: LineItem[]
  subtotal: number
  totalVat: number
  total: number
  balanceDue: number
  noteToCustomer?: string
  memoOnStatement?: string
  attachments: File[]
}

export interface InvoiceFormData {
  customer: Customer | null
  invoiceNo: string
  terms: string
  invoiceDate: string
  dueDate: string
  poNumber: string
  salesRep: string
  tags: string[]
  taxType: 'exclusive' | 'inclusive'
  lineItems: LineItem[]
  noteToCustomer: string
  memoOnStatement: string
}
