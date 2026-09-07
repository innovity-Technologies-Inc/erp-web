import { createFileRoute } from '@tanstack/react-router'
import { VendorOnboardingPage } from '@/modules/procurement/views/vendors/VendorOnboardingPage'

export const Route = createFileRoute('/vendor-onboarding')({
  component: VendorOnboardingPage,
})
