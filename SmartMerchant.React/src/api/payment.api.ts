import api from './api'

// Request types
export interface PaymentRequest {
  invoiceGuid: string
  cardNumber: string
  firstName: string
  lastName: string
  expiryDate: string // MM/YY format
  cvv: string
}

// Response types
export interface PaymentResponse {
  success: boolean
  message: string
  transactionId?: string
  remainingBalance?: number
  error?: string
}

// Payment API functions
export const paymentApi = {
  // Process payment
  async pay(data: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await api.post<PaymentResponse>('/payment/pay', data)
      return response.data
    } catch (error: unknown) {
      // Handle error response from backend
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: PaymentResponse } }
        if (axiosError.response?.data) {
          return axiosError.response.data
        }
      }
      return {
        success: false,
        message: 'Payment failed. Please try again.',
        error: 'PAYMENT_FAILED'
      }
    }
  }
}
