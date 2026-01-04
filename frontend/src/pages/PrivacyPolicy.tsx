export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 border-b-2 border-blue-500 pb-3 mb-4">
          Privacy Policy
        </h1>
        <p className="text-gray-600 italic mb-6">Last Updated: January 2, 2026</p>

        <div className="bg-gray-100 p-4 rounded-md mb-6">
          <p className="mb-1">
            <strong>Application:</strong> Timber 4 U CC QuickBooks Thermal Printing
          </p>
          <p className="mb-1">
            <strong>Company:</strong> Timber 4 U CC
          </p>
          <p>
            <strong>Location:</strong> South Africa
          </p>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p>
            <strong>Important:</strong> This Application is designed for internal business use by Timber 4 U CC. We are committed to protecting your privacy and handling your data with care.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">
            1. Information We Collect
          </h2>

          <h3 className="text-xl font-medium text-gray-700 mb-3">1.1 QuickBooks Data</h3>
          <p className="mb-3">Through your QuickBooks Online authorization, we access:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong>Customer Information:</strong> Names, contact details, billing addresses</li>
            <li><strong>Invoice Data:</strong> Invoice numbers, amounts, line items, dates</li>
            <li><strong>Product/Item Data:</strong> Item names, descriptions, prices</li>
            <li><strong>Tax Information:</strong> Tax codes and rates configured in QuickBooks</li>
            <li><strong>Company Information:</strong> Company name and QuickBooks Realm ID</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-700 mb-3">1.2 Authentication Data</h3>
          <p className="mb-3">We store:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>QuickBooks OAuth access tokens (encrypted)</li>
            <li>QuickBooks refresh tokens (encrypted)</li>
            <li>Session identifiers</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            2. How We Use Your Information
          </h2>
          <p className="mb-3">We use your data exclusively to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Create and manage invoices in QuickBooks Online</li>
            <li>Generate thermal receipt printouts for customers</li>
            <li>Display customer and product information for invoice creation</li>
            <li>Maintain your authenticated session</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            3. Data Storage and Security
          </h2>

          <h3 className="text-xl font-medium text-gray-700 mb-3">3.1 Storage Location</h3>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong>Authentication tokens:</strong> Stored in Supabase (PostgreSQL database) with encryption</li>
            <li><strong>QuickBooks data:</strong> NOT stored locally - accessed in real-time via API</li>
            <li><strong>Server location:</strong> Cloud hosting service (Railway)</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-700 mb-3">3.2 Security Measures</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>HTTPS/SSL encryption for all data transmission</li>
            <li>Secure session management with HTTP-only cookies</li>
            <li>OAuth 2.0 authentication with QuickBooks</li>
            <li>Database encryption for stored tokens</li>
            <li>Regular security updates and patches</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            4. Data Sharing and Third Parties
          </h2>
          <p className="font-semibold mb-3">We do not sell, trade, or share your data with third parties.</p>
          <p className="mb-3">The only external services we interact with are:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>QuickBooks Online:</strong> To access and create data in your QuickBooks account</li>
            <li><strong>Supabase:</strong> For secure session storage (database provider)</li>
            <li><strong>Railway:</strong> For application hosting</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            5. Data Retention
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Session data:</strong> Retained for 30 days of inactivity, then automatically deleted</li>
            <li><strong>OAuth tokens:</strong> Stored until you disconnect the Application from QuickBooks</li>
            <li><strong>QuickBooks data:</strong> Not stored - accessed on-demand from QuickBooks</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            6. Your Rights and Choices
          </h2>
          <p className="mb-3">You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Disconnect:</strong> Revoke Application access at any time through QuickBooks settings</li>
            <li><strong>Delete:</strong> Request deletion of your session data by disconnecting the app</li>
            <li><strong>Access:</strong> Your data remains in QuickBooks under your control</li>
            <li><strong>Review:</strong> Review what data the Application accesses in QuickBooks permissions</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            7. Cookies and Tracking
          </h2>
          <p className="mb-3">We use essential cookies only:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Session cookie (qb_thermal.sid):</strong> Required for authentication and session management</li>
            <li><strong>No tracking cookies:</strong> We do not use analytics, advertising, or tracking cookies</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            8. Children's Privacy
          </h2>
          <p>This Application is designed for business use and is not intended for individuals under 18 years of age.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            9. International Data Transfers
          </h2>
          <p>Your data may be processed in servers located outside South Africa. We ensure appropriate safeguards are in place to protect your data in accordance with this privacy policy.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            10. Changes to Privacy Policy
          </h2>
          <p>We may update this Privacy Policy periodically. Changes will be posted on this page with an updated "Last Updated" date. Continued use of the Application constitutes acceptance of any changes.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            11. POPIA Compliance (South Africa)
          </h2>
          <p className="mb-3">This Application complies with the Protection of Personal Information Act (POPIA). We:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Process data lawfully and reasonably</li>
            <li>Collect data for specific, lawful purposes</li>
            <li>Implement appropriate security safeguards</li>
            <li>Respect your rights as a data subject</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            12. Data Breach Notification
          </h2>
          <p>In the unlikely event of a data breach that affects your personal information, we will notify you within 72 hours as required by applicable law.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            13. Contact Information
          </h2>
          <p className="mb-3">For questions, concerns, or requests regarding your privacy or this Privacy Policy, please contact:</p>
          <p>
            <strong>Timber 4 U CC</strong><br />
            South Africa<br />
            <em>(Add contact email/phone when available)</em>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            14. QuickBooks Data Access
          </h2>
          <p className="mb-3">This Application connects to QuickBooks using OAuth 2.0. You can revoke access at any time by:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Logging into your QuickBooks Online account</li>
            <li>Going to Settings → Manage Apps</li>
            <li>Finding "Timber 4 U CC QuickBooks Thermal Printing"</li>
            <li>Clicking "Disconnect"</li>
          </ol>
        </section>

        <p className="mt-10 pt-6 border-t border-gray-300 text-gray-600 text-sm">
          By using this Application, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
        </p>
      </div>
    </div>
  )
}
