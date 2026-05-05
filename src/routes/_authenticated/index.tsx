import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/modules/dashboard/views/DashboardPage'

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
})
