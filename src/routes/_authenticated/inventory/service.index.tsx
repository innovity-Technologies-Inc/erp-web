import { createFileRoute } from '@tanstack/react-router'
import { ServiceListPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/service/')({
  component: ServiceListPage,
})
