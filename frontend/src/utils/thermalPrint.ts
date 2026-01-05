import { QBOInvoice, InvoiceFormData, Customer, TaxRate, TaxCode } from '../types'
import { formatDate } from './dateFormat'

// Customer lookup - will be set by the component that uses this module
let customerLookup: ((customerId: string) => Customer | null) | null = null

export function setCustomerLookup(lookup: (customerId: string) => Customer | null) {
  customerLookup = lookup
}

// Tax rate lookup - will be set by the component that uses this module
let taxRateLookup: ((taxRateId: string) => TaxRate | null) | null = null

export function setTaxRateLookup(lookup: (taxRateId: string) => TaxRate | null) {
  taxRateLookup = lookup
}

// Tax code lookup - will be set by the component that uses this module
let taxCodeLookup: ((taxCodeId: string) => TaxCode | null) | null = null

export function setTaxCodeLookup(lookup: (taxCodeId: string) => TaxCode | null) {
  taxCodeLookup = lookup
}

// Helper function to get the actual tax rate value from a tax code
function getTaxRateValue(taxCodeId: string): number {
  if (!taxCodeLookup || !taxRateLookup) {
    return 0.15 // Default to 15% if lookups not available
  }

  const taxCode = taxCodeLookup(taxCodeId)
  if (!taxCode) {
    return 0.15 // Default to 15%
  }

  // Get the first tax rate from SalesTaxRateList
  const taxRateRef = taxCode.SalesTaxRateList?.TaxRateDetail?.[0]?.TaxRateRef
  if (!taxRateRef) {
    return 0.15 // Default to 15%
  }

  const taxRate = taxRateLookup(taxRateRef.value)
  if (!taxRate) {
    return 0.15 // Default to 15%
  }

  // Convert percentage to decimal (e.g., 15 -> 0.15)
  return taxRate.RateValue / 100
}

interface ThermalPrintData {
  invoiceNo: string
  date: string
  dueDate: string
  terms: string
  customer: {
    name: string
    companyName?: string
    address?: string
    city?: string
    postalCode?: string
    vatNumber?: string
  }
  items: Array<{
    description: string
    amount: number
  }>
  subtotal: number
  vat: number
  vatRate: number // Tax rate as percentage (e.g., 15 for 15%)
  total: number
  balanceDue: number
}

function convertQBOInvoiceToThermalData(invoice: QBOInvoice, customer: Customer | null): ThermalPrintData {
  // Customer is now passed as parameter instead of looked up via closure

  // Extract line items
  const items = invoice.Line
    .filter(line => line.DetailType === 'SalesItemLineDetail' && line.SalesItemLineDetail)
    .map(line => ({
      description: line.Description || line.SalesItemLineDetail?.ItemRef.name || '',
      amount: line.Amount
    }))

  // Calculate subtotal (total - tax)
  const vat = invoice.TxnTaxDetail?.TotalTax || 0
  const subtotal = invoice.TotalAmt - vat

  // Get tax rate from the first line item's tax code
  let vatRate = 15 // Default to 15%
  const firstLineWithTax = invoice.Line.find(
    line => line.DetailType === 'SalesItemLineDetail' && line.SalesItemLineDetail?.TaxCodeRef
  )
  if (firstLineWithTax?.SalesItemLineDetail?.TaxCodeRef) {
    const taxCodeId = firstLineWithTax.SalesItemLineDetail.TaxCodeRef.value
    const rateDecimal = getTaxRateValue(taxCodeId)
    vatRate = rateDecimal * 100 // Convert to percentage
  }

  // Extract terms from custom field or use default
  const termsField = invoice.CustomField?.find(f => f.Name.toLowerCase().includes('term'))
  const terms = termsField?.StringValue || 'Net 30'

  // Build address from BillAddr
  const billAddr = invoice.BillAddr
  const addressParts = []
  if (billAddr?.Line1) addressParts.push(billAddr.Line1)
  if (billAddr?.Line2) addressParts.push(billAddr.Line2)
  if (billAddr?.Line3) addressParts.push(billAddr.Line3)
  const address = addressParts.join(', ')

  // Extract VAT number from customer's PrimaryTaxIdentifier
  let vatNumber: string | undefined = undefined
  if (customer?.PrimaryTaxIdentifier) {
    const numbers = customer.PrimaryTaxIdentifier.match(/\d+/g)
    if (numbers && numbers.length > 0) {
      vatNumber = numbers.join('')
    }
  }

  return {
    invoiceNo: invoice.DocNumber,
    date: formatDate(invoice.TxnDate),
    dueDate: formatDate(invoice.DueDate),
    terms,
    customer: {
      name: invoice.CustomerRef.name,
      companyName: customer?.CompanyName,
      address: address || undefined,
      city: billAddr?.City,
      postalCode: billAddr?.PostalCode,
      vatNumber
    },
    items,
    subtotal,
    vat,
    vatRate,
    total: invoice.TotalAmt,
    balanceDue: invoice.Balance
  }
}

function convertFormDataToThermalData(
  formData: InvoiceFormData,
  customer: Customer | null
): ThermalPrintData {
  const items = formData.lineItems.map(item => ({
    description: `${item.productName}${item.description ? '\n' + item.description : ''}`,
    amount: item.amount + item.vatAmount
  }))

  const subtotal = formData.lineItems.reduce((sum, item) => sum + item.amount, 0)
  const vat = formData.lineItems.reduce((sum, item) => sum + item.vatAmount, 0)
  const total = subtotal + vat

  // Calculate VAT rate from the first line item
  let vatRate = 15 // Default to 15%
  if (formData.lineItems.length > 0 && formData.lineItems[0].taxRateId) {
    const taxRateDecimal = getTaxRateValue(formData.lineItems[0].taxRateId)
    vatRate = taxRateDecimal * 100 // Convert to percentage
  } else if (vat > 0 && subtotal > 0) {
    // Calculate from actual values if no tax rate ID available
    vatRate = (vat / subtotal) * 100
  }

  // Build address from customer BillAddr
  const billAddr = customer?.BillAddr
  const addressParts = []
  if (billAddr?.Line1) addressParts.push(billAddr.Line1)
  if (billAddr?.Line2) addressParts.push(billAddr.Line2)
  if (billAddr?.Line3) addressParts.push(billAddr.Line3)
  const address = addressParts.join(', ')

  // Extract VAT number from PrimaryTaxIdentifier
  // Format can be "VATNO 4660281926" or "XXX4660281926" (privacy blurred)
  // We just extract the numeric portion which is never blurred
  let vatNumber: string | undefined = undefined
  if (customer?.PrimaryTaxIdentifier) {
    const numbers = customer.PrimaryTaxIdentifier.match(/\d+/g)
    if (numbers && numbers.length > 0) {
      // Join all number sequences (in case there are multiple)
      vatNumber = numbers.join('')
    }
  }

  return {
    invoiceNo: formData.invoiceNo,
    date: formatDate(formData.invoiceDate),
    dueDate: formatDate(formData.dueDate),
    terms: formData.terms,
    customer: {
      name: customer?.DisplayName || 'Unknown Customer',
      companyName: customer?.CompanyName,
      address: address || undefined,
      city: billAddr?.City,
      postalCode: billAddr?.PostalCode,
      vatNumber
    },
    items,
    subtotal,
    vat,
    vatRate,
    total,
    balanceDue: total
  }
}

function generateThermalHTML(data: ThermalPrintData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${data.invoiceNo} - Thermal Print</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
      background: #f0f0f0;
      padding: 20px;
      font-weight: normal;
    }

    .receipt {
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
      background: white;
      padding: 10mm;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .center {
      text-align: center;
    }

    .bold {
      font-weight: bold;
    }

    .large {
      font-size: 14px;
    }

    .company-name {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .section {
      margin: 12px 0;
      padding: 8px 0;
      border-top: 1px dashed #000;
    }

    .section:first-child {
      border-top: none;
    }

    .row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
    }

    .row-label {
      font-weight: 700;
    }

    .item {
      margin: 8px 0;
    }

    .item-header {
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #000;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }

    .item-row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
    }

    .item-desc {
      flex: 1;
      font-size: 12px;
      line-height: 1.3;
      font-weight: normal;
    }

    .item-amount {
      text-align: right;
      white-space: nowrap;
      margin-left: 8px;
    }

    .totals {
      border-top: 1px solid #000;
      padding-top: 8px;
      margin-top: 12px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      margin: 6px 0;
      font-size: 12px;
    }

    .balance-due {
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      padding: 8px 0;
      margin: 12px 0;
      font-size: 14px;
      font-weight: bold;
    }

    .bank-details {
      background: #f5f5f5;
      padding: 8px;
      margin: 12px 0;
      border: 1px solid #ddd;
    }

    .small {
      font-size: 11px;
      font-weight: normal;
    }

    @media print {
      body {
        background: white;
        padding: 0;
        margin: 0;
      }

      .receipt {
        width: 80mm;
        max-width: 80mm;
        margin: 0;
        padding: 0;
        box-shadow: none;
      }

      @page {
        size: 80mm auto;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <!-- Company Header -->
    <div class="center">
      <div class="company-name">TIMBER 4 U CC</div>
      <div class="small">14 Lekkerwater Road</div>
      <div class="small">Sunnydale, Noordhoek</div>
      <div class="small">Western Cape 7975 ZA</div>
      <div class="small">+10217855006</div>
      <div class="small">info@realkey.co.za</div>
      <div class="small">VAT No. 4910248089</div>
    </div>

    <!-- Invoice Type -->
    <div class="section center">
      <div class="large bold">TAX INVOICE</div>
    </div>

    <!-- Bill To -->
    <div class="section">
      <div class="bold">BILL TO:</div>
      <div>${data.customer.name}</div>
      ${data.customer.companyName ? `<div>${data.customer.companyName}</div>` : ''}
      ${data.customer.address ? `<div class="small">${data.customer.address}</div>` : ''}
      ${data.customer.city ? `<div class="small">${data.customer.city}</div>` : ''}
      ${data.customer.postalCode ? `<div class="small">${data.customer.postalCode}</div>` : ''}
      ${data.customer.vatNumber ? `<div class="small">VAT NO. ${data.customer.vatNumber}</div>` : ''}
    </div>

    <!-- Invoice Details -->
    <div class="section">
      <div class="row">
        <span class="row-label">Invoice No:</span>
        <span>${data.invoiceNo}</span>
      </div>
      <div class="row">
        <span class="row-label">Date:</span>
        <span>${data.date}</span>
      </div>
      <div class="row">
        <span class="row-label">Due Date:</span>
        <span>${data.dueDate}</span>
      </div>
      <div class="row">
        <span class="row-label">Terms:</span>
        <span>${data.terms}</span>
      </div>
    </div>

    <!-- Items -->
    <div class="section">
      <div class="item-header">
        <span>DESCRIPTION</span>
        <span>AMOUNT</span>
      </div>

      ${data.items.map(item => `
      <div class="item">
        <div class="item-row">
          <div class="item-desc">
            ${item.description.replace(/\n/g, '<br>')}
          </div>
          <div class="item-amount">R${item.amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</div>
        </div>
      </div>
      `).join('')}
    </div>

    <!-- Totals -->
    <div class="totals">
      <div class="total-row">
        <span>SUBTOTAL:</span>
        <span>R${data.subtotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
      </div>
      <div class="total-row">
        <span>VAT @ ${data.vatRate.toFixed(0)}%:</span>
        <span>R${data.vat.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
      </div>
      <div class="total-row bold large">
        <span>TOTAL:</span>
        <span>R${data.total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
      </div>
    </div>

    <!-- Balance Due -->
    <div class="balance-due center">
      <div class="row">
        <span>BALANCE DUE:</span>
        <span>R${data.balanceDue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
      </div>
    </div>

    <!-- Bank Details -->
    <div class="bank-details center">
      <div class="bold">PAYMENT DETAILS</div>
      <div class="small">STD BANK - CT BR</div>
      <div class="small">ACC NO: 071 265 430</div>
      <div class="small">BR CODE: 051001</div>
    </div>

    <!-- Footer -->
    <div class="center small" style="margin-top: 16px;">
      Thank you for your business!
    </div>
  </div>
  <script>
    // Auto-print when window loads
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`
}

export function openThermalPrint(invoice: QBOInvoice, customer?: Customer | null): void {
  // If customer is provided directly, use it; otherwise fall back to lookup
  const customerToUse = customer !== undefined ? customer : (customerLookup ? customerLookup(invoice.CustomerRef.value) : null)

  const data = convertQBOInvoiceToThermalData(invoice, customerToUse)
  const html = generateThermalHTML(data)

  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  }
}

export function openThermalPrintFromForm(formData: InvoiceFormData, customer: Customer | null): void {
  const data = convertFormDataToThermalData(formData, customer)
  const html = generateThermalHTML(data)

  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  }
}
