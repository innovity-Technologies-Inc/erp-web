import { createFileRoute } from '@tanstack/react-router'
import { ProductEditPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/product/edit/$id')({
  component: ProductEditPage,
})
