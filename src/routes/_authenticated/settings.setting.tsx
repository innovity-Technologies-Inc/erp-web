import { createFileRoute } from '@tanstack/react-router'
import { GeneralSettingPage } from '@/modules/settings'

export const Route = createFileRoute('/_authenticated/settings/setting')({
  component: GeneralSettingPage,
})
