import { createFileRoute } from '@tanstack/react-router'
import { SaleViewPage } from '@/modules/inventory/views/sales/SaleViewPage'

export const Route = createFileRoute('/_authenticated/inventory/sales/print/$id')({
  component: SalePrintPage,
})

function SalePrintPage() {
  return <SaleViewPage isPrintView={true} />
}
