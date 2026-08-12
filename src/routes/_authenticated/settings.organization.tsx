import { createFileRoute } from '@tanstack/react-router'
import { OrganizationPage } from '@/modules/settings'

export const Route = createFileRoute('/_authenticated/settings/organization')({
  component: OrganizationPage,
})
