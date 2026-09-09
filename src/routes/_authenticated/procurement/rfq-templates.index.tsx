import { createFileRoute } from '@tanstack/react-router'
import { RFQEvaluationTemplateListPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/rfq-templates/')({
  component: RFQEvaluationTemplateListPage,
})
