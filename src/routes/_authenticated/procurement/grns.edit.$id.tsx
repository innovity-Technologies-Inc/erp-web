import { createFileRoute } from '@tanstack/react-router'
import { GRNEditPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/grns/edit/$id')({
  component: GRNEditPage,
})
