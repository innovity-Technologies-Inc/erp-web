import { createFileRoute } from '@tanstack/react-router'
import { VendorCategoryListPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/vendors/categories')({
  component: VendorCategoryListPage,
})
