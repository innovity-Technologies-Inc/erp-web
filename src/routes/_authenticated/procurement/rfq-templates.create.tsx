import { createFileRoute } from '@tanstack/react-router'
import { RFQEvaluationTemplateCreatePage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/rfq-templates/create')({
  component: RFQEvaluationTemplateCreatePage,
})
