import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CustomerProvider, ItemProvider, InvoiceProvider, TaxCodeProvider } from './contexts'
import InvoicesList from './pages/InvoicesList'
import CreateInvoice from './pages/CreateInvoice'
import PrivacyPolicy from './pages/PrivacyPolicy'
import EndUserAgreement from './pages/EndUserAgreement'

function App() {
  return (
    <BrowserRouter>
      <CustomerProvider>
        <ItemProvider>
          <TaxCodeProvider>
            <InvoiceProvider>
              <div className="min-h-screen">
                <Routes>
                  <Route path="/" element={<Navigate to="/home" replace />} />
                  <Route path="/home" element={<InvoicesList />} />
                  <Route path="/create-invoice" element={<CreateInvoice />} />
                  <Route path="/edit-invoice/:id" element={<CreateInvoice />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/end-user-agreement" element={<EndUserAgreement />} />
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
