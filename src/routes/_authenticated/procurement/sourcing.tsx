import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/procurement/sourcing')({
  beforeLoad: () => {
    throw redirect({
      to: '/procurement/purchase-requisitions',
    })
  },
})
