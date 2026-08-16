import { createFileRoute } from '@tanstack/react-router'
import { CompanyPage } from '@/modules/settings'

export const Route = createFileRoute('/_authenticated/settings/company')({
  component: CompanyPage,
})
