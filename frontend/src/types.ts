export interface Customer {
  Id: string
  DisplayName: string
  GivenName?: string
  FamilyName?: string
  Title?: string
  CompanyName?: string
  FullyQualifiedName?: string
  PrintOnCheckName?: string
  Active: boolean
  PrimaryEmailAddr?: {
    Address: string
  }
  PrimaryPhone?: {
    FreeFormNumber: string
  }
  Mobile?: {
    FreeFormNumber: string
  }
  Fax?: {
    FreeFormNumber: string
  }
  BillAddr?: {
    Id: string
    Line1?: string
    Line2?: string
    Line3?: string
    City?: string
    Country?: string
    CountrySubDivisionCode?: string
    PostalCode?: string
  }
  ShipAddr?: {
    Id: string
    Line1?: string
    Line2?: string
    Line3?: string
    City?: string
    Country?: string
    CountrySubDivisionCode?: string
    PostalCode?: string
  }
  Balance: number
  BalanceWithJobs: number
  CurrencyRef?: {
    value: string
    name: string
  }
  PrimaryTaxIdentifier?: string
  SecondaryTaxIdentifier?: string
  Taxable: boolean
  PreferredDeliveryMethod?: string
  Job: boolean
  BillWithParent: boolean
  IsProject: boolean
  SyncToken: string
  MetaData?: {
    CreateTime: string
    LastUpdatedTime: string
  }
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
  status: 'paid' | 'unpaid' | 'overdue' | 'deposited'
  amountPaid?: number
  createdAt?: string
  updatedAt?: string
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
