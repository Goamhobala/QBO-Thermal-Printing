import { QBOInvoice, InvoiceFormData, Customer } from '../types'

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
  total: number
  balanceDue: number
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function convertQBOInvoiceToThermalData(invoice: QBOInvoice): ThermalPrintData {
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

  return {
    invoiceNo: invoice.DocNumber,
    date: formatDate(invoice.TxnDate),
    dueDate: formatDate(invoice.DueDate),
    terms,
    customer: {
      name: invoice.CustomerRef.name,
      address: address || undefined,
      city: billAddr?.City,
      postalCode: billAddr?.PostalCode,
      // VAT number would be in custom fields - need to check QBO structure
    },
    items,
    subtotal,
    vat,
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

  // Build address from customer BillAddr
  const billAddr = customer?.BillAddr
  const addressParts = []
  if (billAddr?.Line1) addressParts.push(billAddr.Line1)
  if (billAddr?.Line2) addressParts.push(billAddr.Line2)
  if (billAddr?.Line3) addressParts.push(billAddr.Line3)
  const address = addressParts.join(', ')

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
      vatNumber: customer?.PrimaryTaxIdentifier
    },
    items,
    subtotal,
    vat,
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
      font-weight: 600;
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
      font-weight: 600;
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
      font-weight: 600;
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
      ${data.customer.vatNumber ? `<div class="small">VAT: ${data.customer.vatNumber}</div>` : ''}
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
        <span>VAT @ 15%:</span>
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

export function openThermalPrint(invoice: QBOInvoice): void {
  const data = convertQBOInvoiceToThermalData(invoice)
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
