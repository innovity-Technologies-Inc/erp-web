import { createFileRoute } from '@tanstack/react-router'
import { CategoryListPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/product/sub-category')({
  component: () => <CategoryListPage isSubCategory={true} />,
})
