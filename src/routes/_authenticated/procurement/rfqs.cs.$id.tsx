import { createFileRoute, redirect } from '@tanstack/react-router'
import { RFQComparativeStatementPage } from '@/modules/procurement'
import { useAuthStore } from '@/store/useAuthStore'

export const Route = createFileRoute('/_authenticated/procurement/rfqs/cs/$id')({
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    // Strictly forbid vendors from accessing Comparative Statement (CS Matrix)
    if (user?.user_type === 'vendor') {
      throw redirect({
        to: '/procurement/rfqs',
      })
    }
  },
  component: RFQComparativeStatementPage,
})
