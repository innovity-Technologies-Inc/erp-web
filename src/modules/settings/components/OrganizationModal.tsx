import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, PenLine } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { organizationSchema, type OrganizationFormValues } from '../hooks/validation'
import { useOrganizationDetails, useStoreOrganization } from '../hooks/useOrganizations'
import { useUiStore } from '@/store/useUiStore'
import { Select2 } from '@/components/Select/Select2'

interface OrganizationModalProps {
  isOpen: boolean
  onClose: () => void
  organizationUuid: string | null
}

export const OrganizationModal = ({ isOpen, onClose, organizationUuid }: OrganizationModalProps) => {
  const { mutate: storeOrganization, isPending: isSaving } = useStoreOrganization()
  const { showNotificationModal } = useUiStore()

  // Track the organization integer ID for updates
  const [orgId, setOrgId] = useState<number | undefined>(undefined)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema) as any,
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      expire_at: '',
      status: 1,
    },
  })

  // Fetch details if uuid is passed
  const { data: detailsData, isLoading: isLoadingDetails } = useOrganizationDetails(organizationUuid)

  // Prepopulate form when details are fetched
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened. organizationUuid:', organizationUuid, 'detailsData:', detailsData)
      if (organizationUuid && detailsData?.response) {
        const org = detailsData.response
        console.log('Prehydrating organization form details:', org)
        setOrgId(org.id)
        reset({
          name: org.name || '',
          phone: org.phone || '',
          email: org.email || '',
          address: org.address || '',
          expire_at: org.expire_at ? org.expire_at.split('T')[0] : '',
          status: org.status !== undefined && org.status !== null ? Number(org.status) : 1,
        })
      } else {
        console.log('Prehydrating blank/default organization form')
        setOrgId(undefined)
        reset({
          name: '',
          phone: '',
          email: '',
          address: '',
          expire_at: '',
          status: 1,
        })
      }
    }
  }, [isOpen, organizationUuid, detailsData, reset])

  const statusOptions = useMemo(
    () => [
      { value: 1, label: 'Active' },
      { value: 0, label: 'Inactive' },
    ],
    []
  )

  const onSubmit = (data: OrganizationFormValues) => {
    console.log('Form raw onSubmit data:', data)
    const payload = {
      id: orgId, // Include ID if editing
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      expire_at: data.expire_at || null,
      status: Number(data.status),
    }
    console.log('Submitting organization payload to backend:', payload)

    storeOrganization(payload, {
      onSuccess: (res: any) => {
        console.log('Save organization success response:', res)
        onClose()
        showNotificationModal(
          'Saved Successfully!',
          res.message || 'Organization details have been saved successfully.',
          'success'
        )
      },
      onError: (err: any) => {
        console.error('Save organization error:', err)
        const msg = err.response?.data?.message || err.message || 'Failed to save organization.'
        showNotificationModal('Save Failed', msg, 'error')
      },
    })
  }

  const isPending = isSaving
  const isFetching = !!organizationUuid && isLoadingDetails

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={organizationUuid ? 'Edit Organization' : 'Add New Organization'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending || isFetching}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isPending} disabled={isFetching}>
            {organizationUuid ? (
              <>
                <PenLine className="h-4 w-4" />
                Update
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      }
    >
      {isFetching ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] text-gray-400 font-medium tracking-tight">Loading details...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Organization Name" error={errors.name?.message} required>
            <input
              {...register('name')}
              type="text"
              className="erp-input w-full"
              placeholder="e.g. Acme Corp"
              autoComplete="off"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Phone" error={errors.phone?.message} required>
              <input
                {...register('phone')}
                type="text"
                className="erp-input w-full"
                placeholder="e.g. +880 1711..."
                autoComplete="off"
              />
            </FormField>

            <FormField label="Email" error={errors.email?.message} required>
              <input
                {...register('email')}
                type="email"
                className="erp-input w-full"
                placeholder="e.g. info@acme.com"
                autoComplete="off"
              />
            </FormField>
          </div>

          <FormField label="Address" error={errors.address?.message} required>
            <textarea
              {...register('address')}
              className="erp-input w-full p-3 min-h-[100px]"
              placeholder="Write full address here"
              autoComplete="off"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Expiry Date" error={errors.expire_at?.message}>
              <input
                {...register('expire_at')}
                type="date"
                className="erp-input w-full"
              />
            </FormField>

            <FormField label="Status">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select2
                    options={statusOptions}
                    value={field.value as any}
                    onChange={(val) => field.onChange(val)}
                    className="w-full"
                    menuPortalTarget={document.body}
                  />
                )}
              />
            </FormField>
          </div>
        </form>
      )}
    </Modal>
  )
}
