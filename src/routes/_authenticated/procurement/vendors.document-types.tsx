import { createFileRoute } from '@tanstack/react-router'
import { VendorDocumentTypeListPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/vendors/document-types')({
  component: VendorDocumentTypeListPage,
})
