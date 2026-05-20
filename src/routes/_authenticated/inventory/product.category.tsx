import { createFileRoute } from '@tanstack/react-router'
import { CategoryListPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/product/category')({
  component: () => <CategoryListPage isSubCategory={false} />,
})
