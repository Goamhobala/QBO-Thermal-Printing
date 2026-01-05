import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, ChevronDown, Printer, Edit, DollarSign, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useInvoice, useCustomer, useTaxRate, useTaxCode } from '../contexts'
import { cn } from '../lib/utils'
import { openThermalPrint, setCustomerLookup, setTaxRateLookup, setTaxCodeLookup } from '../utils/thermalPrint'
import { formatDate } from '../utils/dateFormat'

const ITEMS_PER_PAGE = 10

type SortField = 'date' | 'number' | 'customer' | 'amount' | 'status'
type SortDirection = 'asc' | 'desc'

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
  const { data: customers, fetchData: fetchCustomers } = useCustomer()
  const { data: taxRates, fetchData: fetchTaxRates } = useTaxRate()
  const { data: taxCodes, fetchData: fetchTaxCodes } = useTaxCode()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [customerFilter, setCustomerFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('last-12-months')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Fetch data on mount
  useEffect(() => {
    fetchData()
    fetchCustomers()
    fetchTaxRates()
    fetchTaxCodes()
  }, [fetchData, fetchCustomers, fetchTaxRates, fetchTaxCodes])

  // Set up customer lookup for thermal printing
  useEffect(() => {
    setCustomerLookup((customerId: string) => {
      return customers.find(c => c.Id === customerId) || null
    })
  }, [customers])

  // Set up tax rate lookup for thermal printing
  useEffect(() => {
    setTaxRateLookup((taxRateId: string) => {
      return taxRates.find(tr => tr.Id === taxRateId) || null
    })
  }, [taxRates])

  // Set up tax code lookup for thermal printing
  useEffect(() => {
    setTaxCodeLookup((taxCodeId: string) => {
      return taxCodes.find(tc => tc.Id === taxCodeId) || null
    })
  }, [taxCodes])

  // Get unique customers for filter
  const uniqueCustomers = useMemo(() => {
    const customers = new Set(qboInvoices.map(inv => inv.CustomerRef.name).filter(Boolean))
    return Array.from(customers)
  }, [qboInvoices])

  // Handle column sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    // First, filter invoices
    const filtered = qboInvoices.filter(invoice => {
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

    // Then, sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'date':
          comparison = new Date(a.TxnDate).getTime() - new Date(b.TxnDate).getTime()
          break
        case 'number':
          comparison = a.DocNumber.localeCompare(b.DocNumber, undefined, { numeric: true })
          break
        case 'customer':
          comparison = a.CustomerRef.name.localeCompare(b.CustomerRef.name)
          break
        case 'amount':
          comparison = a.TotalAmt - b.TotalAmt
          break
        case 'status':
          const statusA = getInvoiceStatus(a.Balance, a.DueDate)
          const statusB = getInvoiceStatus(b.Balance, b.DueDate)
          const statusOrder = { paid: 0, unpaid: 1, overdue: 2, deposited: 3 }
          comparison = statusOrder[statusA] - statusOrder[statusB]
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [qboInvoices, searchTerm, statusFilter, customerFilter, sortField, sortDirection])

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
    // Check if it's an authentication error
    const isAuthError = error.includes('Not authenticated') || error.includes('401')

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-orange-200 p-8 max-w-md shadow-lg">
          {isAuthError ? (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
                <p className="text-gray-600 mb-6">
                  Please log in to QuickBooks to access your invoices.
                </p>
              </div>
              <div className="space-y-3">
                <a
                  href="/login"
                  className="block w-full px-4 py-3 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Login to QuickBooks
                </a>
                <button
                  onClick={() => fetchData()}
                  className="block w-full px-4 py-3 bg-gray-100 text-gray-700 text-center rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Invoices</h2>
              <p className="text-gray-700 mb-4">{error}</p>
              <div className="space-y-2">
                <button
                  onClick={() => fetchData()}
                  className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Retry
                </button>
                <a
                  href="/login"
                  className="block w-full px-4 py-2 bg-gray-100 text-gray-700 text-center rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Login Again
                </a>
              </div>
            </>
          )}
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
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                    >
                      Date
                      {sortField === 'date' ? (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('number')}
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                    >
                      No.
                      {sortField === 'number' ? (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('customer')}
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                    >
                      Customer
                      {sortField === 'customer' ? (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('amount')}
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                    >
                      Amount
                      {sortField === 'amount' ? (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                    >
                      Status
                      {sortField === 'status' ? (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
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
                            onClick={() => {
                              // Find the customer for this invoice and pass it directly
                              const customer = customers.find(c => c.Id === invoice.CustomerRef.value) || null
                              openThermalPrint(invoice, customer)
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Print Receipt"
                            disabled={!customers || customers.length === 0}
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
