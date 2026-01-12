import api from './api'

// Response types
export interface DashboardStats {
  currentBalance: number
  pendingSettlements: number
  todayTransactionsCount: number
  successRate: number
  chargebackRisk: number
  balanceChangePercent: number
}

export interface DashboardMerchant {
  code: string
  name: string
}

export interface DashboardStatsResponse {
  success: boolean
  stats: DashboardStats
  merchant: DashboardMerchant
}

export interface DashboardTransaction {
  invoiceGuid: string
  orderId: string
  customer: string
  amount: number
  status: string
  timestamp: string
  timeAgo: string
}

export interface DashboardTransactionsResponse {
  success: boolean
  transactions: DashboardTransaction[]
}

// Dashboard API functions
export const dashboardApi = {
  // Get dashboard stats
  async getStats(): Promise<{ stats: DashboardStats; merchant: DashboardMerchant } | null> {
    try {
      const response = await api.get<DashboardStatsResponse>('/dashboard/stats')
      if (response.data.success) {
        return {
          stats: response.data.stats,
          merchant: response.data.merchant
        }
      }
      return null
    } catch {
      return null
    }
  },

  // Get recent transactions
  async getTransactions(limit: number = 10): Promise<DashboardTransaction[]> {
    try {
      const response = await api.get<DashboardTransactionsResponse>('/dashboard/transactions', {
        params: { limit }
      })
      if (response.data.success) {
        return response.data.transactions
      }
      return []
    } catch {
      return []
    }
  }
}
