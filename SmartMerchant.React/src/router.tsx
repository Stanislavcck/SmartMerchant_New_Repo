import { createHashRouter } from 'react-router-dom'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { HomePage } from '@/pages/HomePage'
import { FeaturesPage } from '@/pages/FeaturesPage'
import { PricingPage } from '@/pages/PricingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { PrivacyPage } from '@/pages/PrivacyPage'
import { TermsPage } from '@/pages/TermsPage'
import { PaymentPage } from '@/pages/PaymentPage'
import { ChequePage } from '@/pages/ChequePage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminMerchantPage } from '@/pages/admin/AdminMerchantPage'
import { AdminInvoicesPage } from '@/pages/admin/AdminInvoicesPage'
import { AdminCardsPage } from '@/pages/admin/AdminCardsPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminStorePage } from '@/pages/admin/AdminStorePage'

export const router = createHashRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'features', element: <FeaturesPage /> },
      { path: 'pricing', element: <PricingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: 'terms', element: <TermsPage /> },
    ],
  },
  // Payment routes (standalone, no layout)
  {
    path: '/pay/:invoiceId',
    element: <PaymentPage />,
  },
  {
    path: '/cheque/:invoiceId',
    element: <ChequePage />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'merchant', element: <AdminMerchantPage /> },
      { path: 'invoices', element: <AdminInvoicesPage /> },
      { path: 'cards', element: <AdminCardsPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'store', element: <AdminStorePage /> },
    ],
  },
])
