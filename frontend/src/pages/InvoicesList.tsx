import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, ChevronDown, Printer, Edit, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react'
import { useInvoice } from '../contexts'
import { cn } from '../lib/utils'
import { openThermalPrint } from '../utils/thermalPrint'

const ITEMS_PER_PAGE = 10

// Helper to determine invoice status based on QBO data
const getInvoiceStatus = (balance: number, dueDate: string): 'paid' | 'unpaid' | 'overdue' | 'deposited' => {
  if (balance === 0) return 'paid'
  const due = new Date(dueDate)
  const today = new Date()
  if (due < today) return 'overdue'
  return 'unpaid'
}

export default function InvoicesList() {
  const navigate = useNavigate()
  const { data: qboInvoices, loading, error, fetchData } = useInvoice()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [customerFilter, setCustomerFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('last-12-months')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Fetch invoices on mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Get unique customers for filter
  const uniqueCustomers = useMemo(() => {
    const customers = new Set(qboInvoices.map(inv => inv.CustomerRef.name).filter(Boolean))
    return Array.from(customers)
  }, [qboInvoices])

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return qboInvoices.filter(invoice => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        invoice.DocNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.CustomerRef.name.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      const status = getInvoiceStatus(invoice.Balance, invoice.DueDate)
      const matchesStatus = statusFilter === 'all' || status === statusFilter

      // Customer filter
      const matchesCustomer = customerFilter === 'all' || invoice.CustomerRef.name === customerFilter

      // Date filter (simplified - you can enhance this)
      const matchesDate = true // For now, showing all dates

      return matchesSearch && matchesStatus && matchesCustomer && matchesDate
    })
  }, [qboInvoices, searchTerm, statusFilter, customerFilter])

  // Calculate stats
  const stats = useMemo(() => {
    const overdue = filteredInvoices
      .filter(inv => getInvoiceStatus(inv.Balance, inv.DueDate) === 'overdue')
      .reduce((sum, inv) => sum + inv.Balance, 0)

    const notDueYet = filteredInvoices
      .filter(inv => getInvoiceStatus(inv.Balance, inv.DueDate) === 'unpaid')
      .reduce((sum, inv) => sum + inv.Balance, 0)

    const paid = filteredInvoices
      .filter(inv => getInvoiceStatus(inv.Balance, inv.DueDate) === 'paid')
      .reduce((sum, inv) => sum + inv.TotalAmt, 0)

    const deposited = filteredInvoices
      .filter(inv => inv.Deposit > 0)
      .reduce((sum, inv) => sum + inv.Deposit, 0)

    return { overdue, notDueYet, paid, deposited }
  }, [filteredInvoices])

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE)
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredInvoices.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredInvoices, currentPage])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-700 bg-green-50 border-green-200'
      case 'overdue': return 'text-orange-700 bg-orange-50 border-orange-200'
      case 'unpaid': return 'text-gray-700 bg-gray-50 border-gray-200'
      case 'deposited': return 'text-blue-700 bg-blue-50 border-blue-200'
      default: return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-ZA', { day: '2-digit', month: '2-digit', year: 'numeric' })
      .replace(/\//g, '/')
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoices...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-red-200 p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Invoices</h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => fetchData()}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoices</h1>
        </div>

        {/* Stats Cards - Compact */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-600 mb-1">Overdue</p>
            <p className="text-lg font-bold text-orange-600">R {stats.overdue.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-600 mb-1">Not due yet</p>
            <p className="text-lg font-bold text-gray-900">R {stats.notDueYet.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-600 mb-1">Paid (Last 30 days)</p>
            <p className="text-lg font-bold text-green-600">R {stats.paid.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-600 mb-1">Deposited</p>
            <p className="text-lg font-bold text-blue-600">R {stats.deposited.toFixed(2)}</p>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search invoices by number or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")} />
            </button>

            {/* Big Create Invoice Button */}
            <button
              onClick={() => navigate('/create-invoice')}
              className="px-8 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg shadow-sm"
            >
              Create invoice
            </button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="overdue">Overdue</option>
                  <option value="deposited">Deposited</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Customers</option>
                  {uniqueCustomers.map(customer => (
                    <option key={customer} value={customer}>{customer}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="last-12-months">Last 12 months</option>
                  <option value="last-30-days">Last 30 days</option>
                  <option value="last-90-days">Last 90 days</option>
                  <option value="this-year">This year</option>
                  <option value="custom">Custom range</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedInvoices.map((invoice) => {
                  const status = getInvoiceStatus(invoice.Balance, invoice.DueDate)
                  return (
                    <tr key={invoice.Id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(invoice.TxnDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.DocNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.CustomerRef.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        R {invoice.TotalAmt.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
                          getStatusColor(status)
                        )}>
                          {status === 'overdue' && `Overdue on ${formatDate(invoice.DueDate)}`}
                          {status === 'paid' && 'Paid'}
                          {status === 'unpaid' && 'Unpaid'}
                          {status === 'deposited' && 'Deposited'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openThermalPrint(invoice)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Print Receipt"
                          >
                            <Printer className="h-4 w-4" />
                            <span className="text-xs">Print</span>
                          </button>
                          <button
                            onClick={() => navigate(`/edit-invoice/${invoice.Id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                            title="Edit Invoice"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="text-xs">Edit</span>
                          </button>
                          <button
                            onClick={() => console.log('Receive payment:', invoice.DocNumber)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors"
                            title="Receive Payment"
                          >
                            <DollarSign className="h-4 w-4" />
                            <span className="text-xs">Payment</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredInvoices.length)}
                    </span> of{' '}
                    <span className="font-medium">{filteredInvoices.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "relative inline-flex items-center px-4 py-2 border text-sm font-medium",
                          page === currentPage
                            ? "z-10 bg-green-50 border-green-500 text-green-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        )}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* No results */}
        {filteredInvoices.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No invoices found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
