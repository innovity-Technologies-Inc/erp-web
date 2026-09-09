import { createFileRoute } from '@tanstack/react-router'
import { TermsLibraryListPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/terms-library')({
  component: TermsLibraryListPage,
})
