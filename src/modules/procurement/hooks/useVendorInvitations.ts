import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getVendorInvitations,
  getVendorInvitation,
  sendVendorInvitation,
  cancelVendorInvitation,
  validateVendorOnboardingToken,
  submitVendorOnboarding,
} from '../api/vendorInvitation.api'
import { vendorInvitationKeys, vendorKeys } from '../api/vendor.keys'
import type {
  VendorInvitationFilters,
  SendVendorInvitationDto,
  SubmitVendorOnboardingDto,
} from '../api/types'

export const useVendorInvitations = (filters: VendorInvitationFilters = {}) => {
  return useQuery({
    queryKey: vendorInvitationKeys.list(filters),
    queryFn: () => getVendorInvitations(filters),
  })
}

export const useVendorInvitationDetails = (uuid: string | null) => {
  return useQuery({
    queryKey: vendorInvitationKeys.detail(uuid),
    queryFn: () => getVendorInvitation(uuid!),
    enabled: !!uuid,
  })
}

export const useSendVendorInvitation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: SendVendorInvitationDto) => sendVendorInvitation(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorInvitationKeys.all(),
        refetchType: 'all',
      })
    },
  })
}

export const useCancelVendorInvitation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => cancelVendorInvitation(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorInvitationKeys.all(),
        refetchType: 'all',
      })
    },
  })
}

export const useValidateOnboardingToken = (token: string) => {
  return useQuery({
    queryKey: ['procurement', 'vendor-onboarding', 'validate', token],
    queryFn: () => validateVendorOnboardingToken(token),
    enabled: !!token,
    retry: false,
  })
}

export const useSubmitVendorOnboarding = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: SubmitVendorOnboardingDto) => submitVendorOnboarding(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vendorKeys.all(),
        refetchType: 'all',
      })
      queryClient.invalidateQueries({
        queryKey: vendorInvitationKeys.all(),
        refetchType: 'all',
      })
    },
  })
}
