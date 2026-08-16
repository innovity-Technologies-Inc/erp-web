import { createFileRoute } from '@tanstack/react-router'
import { FixedAssetReportPage } from '@/modules/account/views/reports/FixedAssetReportPage'

export const Route = createFileRoute('/_authenticated/account/reports/fixed-assets')({
  component: FixedAssetReportPage,
})
