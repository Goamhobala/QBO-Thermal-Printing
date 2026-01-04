export default function EndUserAgreement() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 border-b-2 border-blue-500 pb-3 mb-4">
          End User Agreement
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

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing and using the Timber 4 U CC QuickBooks Thermal Printing application ("the Application"), you accept and agree to be bound by the terms and provisions of this agreement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            2. Description of Service
          </h2>
          <p className="mb-3">The Application is an internal business tool that integrates with QuickBooks Online to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Create and manage invoices in QuickBooks Online</li>
            <li>Print thermal receipts (80mm format) for customers</li>
            <li>Access customer and inventory data from QuickBooks</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            3. QuickBooks Integration
          </h2>
          <p className="mb-3">This Application uses the QuickBooks Online API to access your company's QuickBooks data. By authorizing this Application, you grant it permission to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Read customer information</li>
            <li>Read and create invoices</li>
            <li>Read item/product information</li>
            <li>Read tax codes and rates</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            4. Data Usage and Storage
          </h2>
          <p className="mb-3">The Application:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Stores OAuth authentication tokens securely in an encrypted database</li>
            <li>Does not store customer data, invoices, or business information locally</li>
            <li>Accesses QuickBooks data in real-time via API</li>
            <li>Does not share your data with any third parties</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            5. User Responsibilities
          </h2>
          <p className="mb-3">You agree to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Maintain the confidentiality of your login credentials</li>
            <li>Use the Application only for legitimate business purposes</li>
            <li>Ensure all data entered is accurate and complete</li>
            <li>Comply with all applicable laws and regulations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            6. Limitations of Liability
          </h2>
          <p>
            The Application is provided "as is" without warranty of any kind. Timber 4 U CC shall not be liable for any damages arising from the use or inability to use the Application.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            7. Service Availability
          </h2>
          <p>
            While we strive for continuous availability, we do not guarantee that the Application will be available at all times. We reserve the right to suspend or terminate the service for maintenance or updates.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            8. Termination
          </h2>
          <p>
            You may disconnect the Application from QuickBooks at any time through your QuickBooks account settings. We may terminate your access to the Application at any time without notice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            9. Changes to Terms
          </h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the Application after changes constitutes acceptance of the modified terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            10. Governing Law
          </h2>
          <p>
            This agreement shall be governed by and construed in accordance with the laws of South Africa.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            11. Contact Information
          </h2>
          <p>
            For questions about this End User Agreement, please contact:<br />
            <strong>Timber 4 U CC</strong><br />
            South Africa
          </p>
        </section>

        <p className="mt-10 pt-6 border-t border-gray-300 text-gray-600 text-sm">
          By using this Application, you acknowledge that you have read, understood, and agree to be bound by this End User Agreement.
        </p>
      </div>
    </div>
  )
}
