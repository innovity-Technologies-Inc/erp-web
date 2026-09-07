import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, PenLine } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { Select2 } from '@/components/Select/Select2'
import { vendorCategorySchema } from '../../hooks/validation'
import type { VendorCategoryFormValues } from '../../hooks/validation'
import {
  useCreateVendorCategory,
  useUpdateVendorCategory,
  useVendorCategories,
} from '../../hooks/useVendorCategories'
import { useUiStore } from '@/store/useUiStore'
import type { VendorCategory } from '../../api/types'
import { getHierarchicalCategoryOptions } from '../../utils/treeUtils'

interface VendorCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  categoryToEdit?: VendorCategory | null
}

const vendorTypeOptions = [
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'retailer', label: 'Retailer' },
  { value: 'service_provider', label: 'Service Provider' },
  { value: 'importer', label: 'Importer' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'subcontractor', label: 'Subcontractor' },
]

export const VendorCategoryModal = ({
  isOpen,
  onClose,
  categoryToEdit,
}: VendorCategoryModalProps) => {
  const { showNotificationModal } = useUiStore()
  const { mutate: storeCategory, isPending: isStoring } = useCreateVendorCategory()
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateVendorCategory()

  // Fetch all categories to build the hierarchical dropdown options
  const { data: allCategoriesData } = useVendorCategories({ per_page: 200 })

  const rawCategories = useMemo(() => allCategoriesData?.response || [], [allCategoriesData])

  // Hierarchical indented options: Parent, — Child, —— Grandchild
  const parentCategoryOptions = useMemo(() => {
    return getHierarchicalCategoryOptions(rawCategories, categoryToEdit?.id)
  }, [rawCategories, categoryToEdit])

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorCategoryFormValues>({
    resolver: zodResolver(vendorCategorySchema) as any,
    defaultValues: {
      name: '',
      vendor_type: 'distributor',
      parent_id: null,
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        reset({
          name: categoryToEdit.name || '',
          vendor_type: categoryToEdit.vendor_type || 'distributor',
          parent_id: categoryToEdit.parent_id ?? null,
        })
      } else {
        reset({
          name: '',
          vendor_type: 'distributor',
          parent_id: null,
        })
      }
    }
  }, [isOpen, categoryToEdit, reset])

  const onSubmit = (data: VendorCategoryFormValues) => {
    const payload = {
      name: data.name.trim(),
      vendor_type: data.vendor_type,
      parent_id: data.parent_id ? Number(data.parent_id) : null,
    }

    if (categoryToEdit) {
      updateCategory(
        { uuid: categoryToEdit.uuid, ...payload },
        {
          onSuccess: () => {
            onClose()
            showNotificationModal(
              'Category Updated!',
              `Vendor category "${payload.name}" updated successfully.`,
              'success'
            )
          },
          onError: (error: any) => {
            const message = error.response?.data?.message || error.message || 'Failed to update vendor category.'
            showNotificationModal('Update Failed', message, 'error')
          },
        }
      )
    } else {
      storeCategory(payload, {
        onSuccess: () => {
          onClose()
          showNotificationModal(
            'Category Created!',
            `Vendor category "${payload.name}" added successfully.`,
            'success'
          )
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || error.message || 'Failed to create vendor category.'
          showNotificationModal('Create Failed', message, 'error')
        },
      })
    }
  }

  const isPending = isStoring || isUpdating

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={categoryToEdit ? 'Edit Vendor Category' : 'Add Vendor Category'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isPending}>
            {categoryToEdit ? (
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Category Name" error={errors.name?.message} required>
          <input
            {...register('name')}
            type="text"
            className="erp-input w-full"
            placeholder="Enter category name"
            autoComplete="off"
            autoFocus
          />
        </FormField>

        <FormField label="Vendor Type" error={errors.vendor_type?.message} required>
          <Controller
            name="vendor_type"
            control={control}
            render={({ field }) => (
              <Select2
                options={vendorTypeOptions}
                value={field.value}
                onChange={(val) => field.onChange(val)}
                placeholder="Select vendor type"
              />
            )}
          />
        </FormField>

        <FormField label="Parent Category" error={errors.parent_id?.message}>
          <Controller
            name="parent_id"
            control={control}
            render={({ field }) => (
              <Select2
                options={parentCategoryOptions}
                value={field.value ?? ''}
                onChange={(val) => field.onChange(val ? Number(val) : null)}
                isClearable
                placeholder="Select parent category"
              />
            )}
          />
        </FormField>
      </form>
    </Modal>
  )
}
