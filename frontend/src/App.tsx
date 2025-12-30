import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import InvoicesList from './pages/InvoicesList'
import CreateInvoice from './pages/CreateInvoice'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Navigate to="/invoices" replace />} />
          <Route path="/invoices" element={<InvoicesList />} />
          <Route path="/create-invoice" element={<CreateInvoice />} />
          <Route path="/edit-invoice/:id" element={<CreateInvoice />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
