import { createFileRoute } from '@tanstack/react-router'
import { ProductCreatePage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/product/create')({
  component: ProductCreatePage,
})
