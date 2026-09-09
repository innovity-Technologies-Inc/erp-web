import { createFileRoute } from '@tanstack/react-router'
import { RFQEvaluationTemplateEditPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/rfq-templates/edit/$id')({
  component: RFQEvaluationTemplateEditPage,
})
