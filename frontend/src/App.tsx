import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CustomerProvider, ItemProvider } from './contexts'
import InvoicesList from './pages/InvoicesList'
import CreateInvoice from './pages/CreateInvoice'

function App() {
  return (
    <BrowserRouter>
      <CustomerProvider>
        <ItemProvider>
          <div className="min-h-screen">
            <Routes>
              <Route path="/" element={<Navigate to="/invoices" replace />} />
              <Route path="/invoices" element={<InvoicesList />} />
              <Route path="/create-invoice" element={<CreateInvoice />} />
              <Route path="/edit-invoice/:id" element={<CreateInvoice />} />
            </Routes>
          </div>
        </ItemProvider>
      </CustomerProvider>
    </BrowserRouter>
  )
}

export default App
