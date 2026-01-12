import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { dashboardApi, invoiceApi } from '@/api'
import type { DashboardStats, DashboardMerchant, DashboardTransaction } from '@/api'
import type { MerchantInvoice } from '@/types'

export function AdminDashboardPage() {
  const { user } = useAuthStore()
  
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [merchant, setMerchant] = useState<DashboardMerchant | null>(null)
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([])
  const [invoices, setInvoices] = useState<MerchantInvoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch dashboard stats
        const statsData = await dashboardApi.getStats()
        if (statsData) {
          setStats(statsData.stats)
          setMerchant(statsData.merchant)
        }

        // Fetch recent transactions
        const transactionsData = await dashboardApi.getTransactions(10)
        setTransactions(transactionsData)

        // Fetch invoices for the table
        const invoicesData = await invoiceApi.getInvoices(1, 10)
        setInvoices(invoicesData.invoices)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      }
      setIsLoading(false)
    }

    fetchData()
  }, [])

  const formatCurrency = (amount: number) => {
    return `₴ ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  // Calculate stats from invoices if API stats not available
  const paidInvoices = invoices.filter(i => i.isPaid)
  const pendingInvoices = invoices.filter(i => !i.isPaid)
  const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.amount, 0)
  const successRate = invoices.length > 0 ? (paidInvoices.length / invoices.length) * 100 : 0

  // Sort invoices by creation date (newest first)
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black oswald uppercase">
            Good Morning, <span className="lime-text">{user?.firstName || 'Merchant'}</span>
          </h2>
          <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">
            Active Merchant ID: <span>{merchant?.code || 'N/A'}</span>
          </p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-xs font-bold hover:bg-white/10">
            Export Data
          </button>
          <Link to="/admin/invoices" className="btn-lime px-6 py-2 rounded-xl text-xs font-black">
            Create Invoice
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 stat-card">
          <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Current Balance</div>
          <div className="text-2xl font-black oswald">{formatCurrency(stats?.currentBalance || 0)}</div>
          <div className="text-xs text-lime-400 font-bold mt-2">Available for withdrawal</div>
        </div>
        <div className="glass-card p-6 stat-card">
          <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Pending Settlements</div>
          <div className="text-2xl font-black oswald">{formatCurrency(stats?.pendingSettlements || pendingAmount)}</div>
          <div className="text-xs text-gray-500 font-bold mt-2">{pendingInvoices.length} unpaid invoices</div>
        </div>
        <div className="glass-card p-6 stat-card">
          <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Today's Transactions</div>
          <div className="text-2xl font-black oswald">{stats?.todayTransactionsCount || transactions.length}</div>
          <div className="text-xs text-lime-400 font-bold mt-2">Success Rate: {(stats?.successRate || successRate).toFixed(1)}%</div>
        </div>
        <div className="glass-card p-6 stat-card">
          <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Invoices</div>
          <div className="text-2xl font-black oswald">{invoices.length}</div>
          <div className="text-xs text-blue-400 font-bold mt-2">{paidInvoices.length} paid</div>
        </div>
      </div>

      <div className="glass-card p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black oswald uppercase">Recent Invoices</h3>
          <Link to="/admin/invoices" className="text-lime-400 text-xs font-black uppercase tracking-widest hover:underline">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-white/10">
              <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <th className="pb-4 pr-4">Invoice #</th>
                <th className="pb-4 pr-4">Description</th>
                <th className="pb-4 pr-4">Amount</th>
                <th className="pb-4 pr-4">Status</th>
                <th className="pb-4">Created</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold">
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 font-bold">
                    No invoices yet
                  </td>
                </tr>
              ) : (
                recentInvoices.map((invoice) => (
                  <tr key={invoice.guid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 pr-4 text-gray-300">#{invoice.number}</td>
                    <td className="py-4 pr-4 text-gray-400 max-w-xs truncate">{invoice.description}</td>
                    <td className="py-4 pr-4">{formatCurrency(invoice.amount)}</td>
                    <td className="py-4 pr-4">
                      {invoice.isPaid ? (
                        <span className="bg-lime-400/20 text-lime-400 px-2 py-1 rounded-md text-[10px] uppercase">Paid</span>
                      ) : (
                        <span className="bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded-md text-[10px] uppercase">Pending</span>
                      )}
                    </td>
                    <td className="py-4 text-gray-500">{formatTimeAgo(invoice.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
