import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, PenLine } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { companySchema, type CompanyFormValues } from '../hooks/validation'
import { useCompanyDetails, useStoreCompany } from '../hooks/useCompanies'
import { usePermissionsList } from '@/modules/user-management/hooks/useRoles'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { Select2 } from '@/components/Select/Select2'

interface CompanyModalProps {
  isOpen: boolean
  onClose: () => void
  companyUuid: string | null
}

export const CompanyModal = ({ isOpen, onClose, companyUuid }: CompanyModalProps) => {
  const { mutate: storeCompany, isPending: isSaving } = useStoreCompany()
  const { showNotificationModal } = useUiStore()
  const loggedInUser = useAuthStore((state) => state.user)

  // Super Admin check
  const isSuperAdmin = useMemo(() => {
    const roles = loggedInUser?.roles || []
    return roles.some((r: any) => {
      const name = typeof r === 'string' ? r : r.name
      return name?.toLowerCase() === 'super-admin' || name?.toLowerCase() === 'super admin'
    })
  }, [loggedInUser])

  // Track the company integer ID for updates
  const [companyId, setCompanyId] = useState<number | undefined>(undefined)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema) as any,
    defaultValues: {
      organization_id: '',
      company_name: '',
      mobile: '',
      email: '',
      website: '',
      address: '',
      vat_no: '',
      cr_no: '',
      status: 1,
    },
  })

  // Fetch companies & orgs (for super-admin)
  const { data: permissionsData, isLoading: isLoadingPermissions } = usePermissionsList()
  const organizations = permissionsData?.data?.organizations || []

  const organizationOptions = useMemo(() => {
    return [
      { value: '', label: 'Select Organization' },
      ...organizations.map((org) => ({ value: String(org.id), label: org.name })),
    ]
  }, [organizations])

  // Fetch details if uuid is passed
  const { data: detailsData, isLoading: isLoadingDetails } = useCompanyDetails(companyUuid)

  // Prepopulate form when details are fetched
  useEffect(() => {
    if (isOpen) {
      if (companyUuid && detailsData?.response) {
        const comp = detailsData.response
        setCompanyId(comp.id)
        reset({
          organization_id: comp.organization_id !== null && comp.organization_id !== undefined ? String(comp.organization_id) : '',
          company_name: comp.company_name || '',
          mobile: comp.mobile || '',
          email: comp.email || '',
          website: comp.website || '',
          address: comp.address || '',
          vat_no: comp.vat_no || '',
          cr_no: comp.cr_no || '',
          status: comp.status !== undefined && comp.status !== null ? Number(comp.status) : 1,
        })
      } else {
        setCompanyId(undefined)
        reset({
          organization_id: isSuperAdmin ? '' : (loggedInUser?.organization_id ? String(loggedInUser.organization_id) : ''),
          company_name: '',
          mobile: '',
          email: '',
          website: '',
          address: '',
          vat_no: '',
          cr_no: '',
          status: 1,
        })
      }
    }
  }, [isOpen, companyUuid, detailsData, reset, isSuperAdmin, loggedInUser])

  const statusOptions = useMemo(
    () => [
      { value: 1, label: 'Active' },
      { value: 0, label: 'Inactive' },
    ],
    []
  )

  const onSubmit = (data: CompanyFormValues) => {
    const payload = {
      id: companyId,
      organization_id: data.organization_id || null,
      company_name: data.company_name,
      mobile: data.mobile,
      email: data.email,
      website: data.website || null,
      address: data.address,
      vat_no: data.vat_no || null,
      cr_no: data.cr_no || null,
      status: Number(data.status),
    }

    storeCompany(payload, {
      onSuccess: (res: any) => {
        onClose()
        showNotificationModal(
          'Saved Successfully!',
          res.message || 'Company details have been saved successfully.',
          'success'
        )
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.message || 'Failed to save company.'
        showNotificationModal('Save Failed', msg, 'error')
      },
    })
  }

  const isPending = isSaving
  const isFetching = (!!companyUuid && isLoadingDetails) || isLoadingPermissions

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={companyUuid ? 'Edit Company' : 'Add New Company'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending || isFetching}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isPending} disabled={isFetching}>
            {companyUuid ? (
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
          {isSuperAdmin && (
            <FormField label="Organization" error={errors.organization_id?.message as string}>
              <Controller
                name="organization_id"
                control={control}
                render={({ field }) => (
                  <Select2
                    options={organizationOptions}
                    value={field.value as any}
                    onChange={(val) => field.onChange(val)}
                    className="w-full"
                    menuPortalTarget={document.body}
                  />
                )}
              />
            </FormField>
          )}

          <FormField label="Company Name" error={errors.company_name?.message} required>
            <input
              {...register('company_name')}
              type="text"
              className="erp-input w-full"
              placeholder="e.g. GenITech Solutions"
              autoComplete="off"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Mobile" error={errors.mobile?.message} required>
              <input
                {...register('mobile')}
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
                placeholder="e.g. info@company.com"
                autoComplete="off"
              />
            </FormField>
          </div>

          <FormField label="Website" error={errors.website?.message}>
            <input
              {...register('website')}
              type="text"
              className="erp-input w-full"
              placeholder="e.g. https://www.company.com"
              autoComplete="off"
            />
          </FormField>

          <FormField label="Address" error={errors.address?.message} required>
            <textarea
              {...register('address')}
              className="erp-input w-full p-3 min-h-[80px]"
              placeholder="Write full address here"
              autoComplete="off"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="EIN/VAT NO" error={errors.vat_no?.message}>
              <input
                {...register('vat_no')}
                type="text"
                className="erp-input w-full"
                placeholder="Enter VAT No"
                autoComplete="off"
              />
            </FormField>

            <FormField label="CR NO" error={errors.cr_no?.message}>
              <input
                {...register('cr_no')}
                type="text"
                className="erp-input w-full"
                placeholder="Enter CR No"
                autoComplete="off"
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
