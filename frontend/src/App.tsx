import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CustomerProvider, ItemProvider, InvoiceProvider, TaxCodeProvider } from './contexts'
import InvoicesList from './pages/InvoicesList'
import CreateInvoice from './pages/CreateInvoice'

function App() {
  return (
    <BrowserRouter>
      <CustomerProvider>
        <ItemProvider>
          <TaxCodeProvider>
            <InvoiceProvider>
              <div className="min-h-screen">
                <Routes>
                  <Route path="/" element={<Navigate to="/invoices" replace />} />
                  <Route path="/invoices" element={<InvoicesList />} />
                  <Route path="/create-invoice" element={<CreateInvoice />} />
                  <Route path="/edit-invoice/:id" element={<CreateInvoice />} />
                </Routes>
              </div>
            </InvoiceProvider>
          </TaxCodeProvider>
        </ItemProvider>
      </CustomerProvider>
    </BrowserRouter>
  )
}

export default App
