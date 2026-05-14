import { createFileRoute } from '@tanstack/react-router'
import { ContactUsListPage } from '@/modules/inventory'

export const Route = createFileRoute('/_authenticated/inventory/contact-us/')({
  component: ContactUsListPage,
})
