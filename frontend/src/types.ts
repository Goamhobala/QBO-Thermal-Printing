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

// QuickBooks Item (Product/Service from QBO)
export interface Item {
  Id: string
  Name: string
  FullyQualifiedName: string
  domain: string
  Type: string
  Active: boolean
  sparse: boolean
  Sku?: string
  Description?: string
  UnitPrice?: number
  PurchaseCost?: number
  TrackQtyOnHand?: boolean
  Taxable?: boolean
  PrintGroupedItems?: boolean
  ItemGroupDetail?: {
    ItemGroupLine: Array<{
      Qty: number
      ItemRef: {
        type: string
        name: string
        value: string
      }
    }>
  }
  SyncToken: string
  MetaData: {
    CreateTime: string
    LastUpdatedTime: string
  }
}

// Invoice Line Item (used in invoice forms)
export interface LineItem {
  id: string
  itemId?: string // Reference to QBOItem.Id
  productName: string
  sku?: string
  description?: string
  quantity: number
  rate: number
  amount: number
  vatAmount: number
}

// QuickBooks Invoice Response (from QBO API)
export interface QBOInvoice {
  Id: string
  DocNumber: string
  TxnDate: string
  DueDate: string
  domain: string
  PrintStatus: string
  TotalAmt: number
  Balance: number
  Deposit: number
  sparse: boolean
  ApplyTaxAfterDiscount: boolean
  EmailStatus: string
  CustomerRef: {
    value: string
    name: string
  }
  Line: Array<{
    Id?: string
    LineNum?: number
    Description?: string
    Amount: number
    DetailType: string
    SalesItemLineDetail?: {
      ItemRef: {
        value: string
        name: string
      }
      Qty?: number
      UnitPrice?: number
      TaxCodeRef?: {
        value: string
      }
    }
    SubTotalLineDetail?: Record<string, unknown>
  }>
  TxnTaxDetail?: {
    TotalTax: number
  }
  ProjectRef?: {
    value: string
  }
  LinkedTxn?: Array<unknown>
  ShipAddr?: {
    Id: string
    Line1?: string
    Line2?: string
    Line3?: string
    City?: string
    CountrySubDivisionCode?: string
    PostalCode?: string
    Lat?: string
    Long?: string
  }
  BillAddr?: {
    Id: string
    Line1?: string
    Line2?: string
    Line3?: string
    City?: string
    CountrySubDivisionCode?: string
    PostalCode?: string
    Lat?: string
    Long?: string
  }
  CustomerMemo?: {
    value: string
  }
  PrivateNote?: string
  CustomField?: Array<{
    DefinitionId: string
    Type: string
    Name: string
    StringValue?: string
  }>
  SyncToken: string
  MetaData: {
    CreateTime: string
    LastUpdatedTime: string
  }
}

// Local Invoice (used in forms/UI)
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

