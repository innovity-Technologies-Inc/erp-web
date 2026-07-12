import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/account/ein')({
  beforeLoad: () => {
    throw redirect({
      to: '/account/ein-setting',
    })
  },
})
