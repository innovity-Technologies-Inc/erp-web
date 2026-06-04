import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, PenLine } from 'lucide-react'
import { Modal } from '@/components/Modal/Modal'
import { Button } from '@/components/Button/Button'
import { FormField } from '@/components/Form/FormField'
import { productCategorySchema } from '../hooks/validation'
import type { ProductCategoryFormValues } from '../hooks/validation'
import { useStoreCategory, useUpdateCategory, useCategoryList } from '../hooks/useCategories'
import { Select2 } from '@/components/Select/Select2'

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  categoryUuid: string | null
  categoryId: number | null
  initialData?: any | null
  isSubCategory?: boolean
}

export const CategoryModal = ({ 
  isOpen, 
  onClose, 
  categoryUuid, 
  categoryId,
  initialData,
  isSubCategory = false 
}: CategoryModalProps) => {
  const { mutate: storeCategory, isPending: isStoring } = useStoreCategory()
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory()
  const { data: categoryListData } = useCategoryList()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductCategoryFormValues>({
    resolver: zodResolver(productCategorySchema) as any,
    defaultValues: {
      category_name: '',
      parent_id: null,
      status: 1,
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          category_name: initialData.category_name || '',
          parent_id: initialData.parent_id || null,
          status: initialData.status !== undefined ? Number(initialData.status) : 1,
        })
      } else {
        reset({
          category_name: '',
          parent_id: null,
          status: 1,
        })
      }
    }
  }, [isOpen, initialData, reset])

  const statusOptions = useMemo(() => [
    { value: 1, label: 'Active' },
    { value: 0, label: 'Inactive' }
  ], [])

  const categoryOptions = useMemo(() => {
    if (!categoryListData?.response?.categories) return []
    return categoryListData.response.categories
      .filter((cat: any) => cat.category_id !== String(categoryId)) // Prevent self-parenting
      .map((cat: any) => ({
        value: Number(cat.category_id),
        label: cat.full_path || cat.category_name
      }))
  }, [categoryListData, categoryId])

  const onSubmit = (data: ProductCategoryFormValues) => {
    const payload = {
      ...data,
      parent_id: data.parent_id ? Number(data.parent_id) : null,
      status: Number(data.status),
      uuid: categoryUuid
    }

    if (categoryUuid) {
      updateCategory(payload, {
        onSuccess: () => {
          onClose()
        },
      })
    } else {
      storeCategory(payload, {
        onSuccess: () => {
          onClose()
        },
      })
    }
  }

  const isPending = isStoring || isUpdating

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={categoryUuid ? 'Edit Category' : (isSubCategory ? 'Add New Sub-Category' : 'Add New Category')}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isPending}>
            {categoryUuid ? (
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
        <FormField label="Category Name" error={errors.category_name?.message} required>
          <input
            {...register('category_name')}
            type="text"
            className="erp-input w-full"
            placeholder="Enter category name"
            autoComplete="off"
          />
        </FormField>

        {isSubCategory && (
          <FormField label="Parent Category" error={errors.parent_id?.message}>
            <Controller
              name="parent_id"
              control={control}
              render={({ field }) => (
                <Select2
                  options={[
                    { value: '', label: 'None (Top Level)' },
                    ...categoryOptions
                  ]}
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  className="w-full"
                  placeholder="Select parent category"
                  menuPortalTarget={document.body}
                />
              )}
            />
          </FormField>
        )}

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
      </form>
    </Modal>
  )
}
