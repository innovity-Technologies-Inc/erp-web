import { useState, useRef, useMemo, useEffect } from 'react'
import { useNavigate, Link, useParams } from '@tanstack/react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  ArrowLeft, 
  Check, 
  Info, 
  Image as ImageIcon, 
  FileText, 
  DollarSign,
  Package,
  QrCode,
  Building2,
  Upload,
  X,
  RefreshCw
} from 'lucide-react'
import { productSchema, type ProductFormValues } from '../../hooks/validation'
import { useUpdateProduct, useProductData } from '../../hooks/useProducts'
import { useMainCategorySelect2, useSubCategorySelect2, useCategoryData } from '../../hooks/useCategories'
import { useVendorSelect2 } from '../../hooks/useSuppliers'
import { useUnitSelect2 } from '../../hooks/useUnits'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { clsx } from 'clsx'
import { Select2 } from '@/components/Select/Select2'

export const ProductEditPage = () => {
  const { id } = useParams({ from: '/_authenticated/inventory/product/edit/$id' })
  const navigate = useNavigate()
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
  const { mutate: updateProduct, isPending: isSaving } = useUpdateProduct()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  // Data Fetching
  const { data: productResponse, isLoading: isFetching } = useProductData(id)
  const product = productResponse?.data

  // Lookups
  const { data: mainCategories } = useMainCategorySelect2()
  const { data: vendors } = useVendorSelect2()
  const { data: units } = useUnitSelect2()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProductFormValues & { main_category_id?: number }>({
    resolver: zodResolver(productSchema),
  })

  const status = watch('status')
  const mainCategoryId = watch('main_category_id')

  // Fetch parent category info to set main_category_id
  const { data: categoryResponse } = useCategoryData(product?.category_id || null)
  const categoryData = categoryResponse?.data?.row_data

  const { data: subCategories } = useSubCategorySelect2(mainCategoryId || null)

  useEffect(() => {
    if (product) {
      reset({
        product_id: product.product_id,
        product_name: product.product_name,
        category_id: product.category_id,
        supplier_id: product.supplier_id,
        unit_id: product.unit_id,
        model: product.product_model,
        price: product.price,
        supplier_price: product.supplier_price,
        per_pcs_price: product.per_pcs_price,
        no_of_qty: product.no_of_qty || 0,
        serial_no: product.serial_no,
        product_vat: product.product_vat,
        product_details: product.product_details,
        status: product.status,
      })
      if (product.image) {
          setPreviewUrl(product.image.startsWith('http') ? product.image : `/storage/${product.image}`)
          setFileName(product.image.split('/').pop() || 'product-image.jpg')
      }
    }
  }, [product, reset])

  // Set main_category_id once we have category data from backend
  useEffect(() => {
    if (categoryData) {
      if (categoryData.parent_id) {
        setValue('main_category_id', categoryData.parent_id)
      } else {
        // If it's a root category, it is the main category
        setValue('main_category_id', categoryData.id)
      }
    }
  }, [categoryData, setValue])

  const mainCategoryOptions = useMemo(() => 
    mainCategories?.map((c: any) => ({ value: c.id, label: c.text })) || [], [mainCategories]
  )

  const subCategoryOptions = useMemo(() => 
    subCategories?.map((c: any) => ({ value: c.id, label: c.text })) || [], [subCategories]
  )

  const vendorOptions = useMemo(() => 
    vendors?.map((v: any) => ({ value: v.id, label: v.text })) || [], [vendors]
  )
  const unitOptions = useMemo(() => 
    units?.map((u: any) => ({ value: u.id, label: u.text })) || [], [units]
  )

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setValue('image', e.target.files, { shouldDirty: true })
      setPreviewUrl(URL.createObjectURL(file))
      setFileName(file.name)
    }
  }

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreviewUrl(null)
    setFileName(null)
    setValue('image', null, { shouldDirty: true })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = (data: ProductFormValues) => {
    const formData = new FormData()
    
    formData.append('uuid', product?.uuid)
    formData.append('product_name', data.product_name)
    formData.append('category_id', String(data.category_id))
    formData.append('supplier_id', String(data.supplier_id))
    formData.append('status', String(data.status ? 1 : 0))
    
    if (data.product_id) formData.append('product_id', data.product_id)
    if (data.model) formData.append('model', data.model)
    if (data.unit_id) formData.append('unit_id', String(data.unit_id))
    if (data.price !== null) formData.append('price', String(data.price))
    if (data.supplier_price !== null) formData.append('supplier_price', String(data.supplier_price))
    if (data.per_pcs_price !== null) formData.append('per_pcs_price', String(data.per_pcs_price))
    if (data.no_of_qty !== null) formData.append('no_of_qty', String(data.no_of_qty))
    if (data.serial_no) formData.append('serial_no', data.serial_no)
    if (data.product_vat !== null) formData.append('product_vat', String(data.product_vat))
    if (data.product_details) formData.append('product_details', data.product_details)

    if (data.image?.[0]) {
      formData.append('image', data.image[0])
    }

    updateProduct(formData, {
      onSuccess: () => navigate({ to: '/inventory/product' }),
    })
  }

  const handleDiscard = () => {
    if (isDirty) {
      setIsDiscardModalOpen(true)
    } else {
      navigate({ to: '/inventory/product' })
    }
  }

  if (isFetching) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f1f0f5] pb-10 font-poppins text-[#475569]">
      {/* Page Header */}
      <div className="max-w-[1600px] mx-auto pb-6">
        <div className="flex items-center gap-4">
          <Link 
            to="/inventory/product"
            className="flex items-center gap-2 px-2 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors shadow-sm text-[10px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            <span>Back</span>
          </Link>
          <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">
            Edit Product: <span className="text-[#1e293b] font-bold">{product?.product_name}</span>
          </h1>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/5 rounded-lg text-primary">
                    <Info className="h-5 w-5" />
                  </div>
                  <h2 className="text-[16px] font-bold text-[#1e293b]">Basic Information</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-[#475569]">Product Name <span className="text-rose-500">*</span></label>
                    <input
                      {...register('product_name')}
                      autoComplete="off"
                      placeholder="e.g., Enterprise Server v2.0"
                      className={clsx(
                        "w-full h-[44px] px-4 bg-white border rounded-lg text-[13px] outline-none transition-all font-medium hover:border-gray-300",
                        errors.product_name ? "border-rose-500 focus:ring-rose-500/10" : "border-gray-200 focus:ring-1 focus:ring-primary/30 focus:border-primary"
                      )}
                    />
                    {errors.product_name && <span className="text-rose-500 text-[11px] font-medium">{errors.product_name.message}</span>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-[#475569]">Barcode/QR-code <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <input
                          {...register('product_id')}
                          autoComplete="off"
                          placeholder="Scan or enter code"
                          className={clsx(
                            "w-full h-[44px] px-4 pr-10 bg-white border rounded-lg text-[13px] outline-none transition-all font-medium hover:border-gray-300",
                            errors.product_id ? "border-rose-500 focus:ring-rose-500/10" : "border-gray-200 focus:ring-1 focus:ring-primary/30 focus:border-primary"
                          )}
                        />
                        <QrCode className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      </div>
                      {errors.product_id && <span className="text-rose-500 text-[11px] font-medium">{errors.product_id.message}</span>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-[#475569]">Serial Number (SN)</label>
                      <input
                        {...register('serial_no')}
                        autoComplete="off"
                        placeholder="111,abc,XYZ"
                        className="w-full h-[44px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-[#475569]">Product Category <span className="text-rose-500">*</span></label>
                      <Controller
                        control={control}
                        name="main_category_id"
                        render={({ field }) => (
                          <Select2
                            options={mainCategoryOptions}
                            value={field.value}
                            onChange={(val) => {
                              field.onChange(val)
                              setValue('category_id', undefined)
                            }}
                            placeholder="Select product category"
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-[#475569]">Product Sub-Category <span className="text-rose-500">*</span></label>
                      <Controller
                        control={control}
                        name="category_id"
                        render={({ field }) => (
                          <Select2
                            options={subCategoryOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select sub-category"
                            disabled={!mainCategoryId}
                            className={errors.category_id ? "border-rose-500" : ""}
                          />
                        )}
                      />
                      {errors.category_id && <span className="text-rose-500 text-[11px] font-medium">{errors.category_id.message}</span>}
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[13px] font-semibold text-[#475569]">Unit <span className="text-rose-500">*</span></label>
                      <Controller
                        control={control}
                        name="unit_id"
                        render={({ field }) => (
                          <Select2
                            options={unitOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select Unit"
                            className={errors.unit_id ? "border-rose-500" : ""}
                          />
                        )}
                      />
                      {errors.unit_id && <span className="text-rose-500 text-[11px] font-medium">{errors.unit_id.message}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Inventory */}
              <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <h2 className="text-[16px] font-bold text-[#1e293b]">Pricing & Inventory</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-[#475569]">Sale Price ($)</label>
                    <input
                      {...register('price')}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full h-[44px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-[#475569]">Cost Price ($)</label>
                    <input
                      {...register('supplier_price')}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full h-[44px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-[#475569]">Per Pcs Price ($)</label>
                    <input
                      {...register('per_pcs_price')}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full h-[44px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-[#475569]">Stock Quantity (Pcs)</label>
                    <input
                      {...register('no_of_qty')}
                      type="number"
                      placeholder="01"
                      className="w-full h-[44px] px-4 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h2 className="text-[16px] font-bold text-[#1e293b]">Product Details</h2>
                </div>
                <textarea
                  {...register('product_details')}
                  rows={6}
                  placeholder="Select product category"
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl text-[13px] outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary hover:border-gray-300 transition-all font-medium resize-none"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-4 space-y-6">
              {/* Product Media */}
              <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <h2 className="text-[16px] font-bold text-[#1e293b]">Product Media</h2>
                </div>

                <div className="space-y-4">
                  <div 
                    onClick={handleUploadClick}
                    className="group relative border-2 border-dashed border-gray-200 rounded-2xl p-8 transition-all hover:border-primary/50 hover:bg-primary/5 cursor-pointer text-center"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6 text-gray-400 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[14px] font-bold text-[#1e293b]">Click or drag image to upload</p>
                        <p className="text-[12px] text-gray-400 font-medium">PNG, JPG or WEBP (Max. 2MB)</p>
                      </div>
                    </div>
                  </div>

                  {fileName && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl group animate-in fade-in slide-in-from-top-2">
                      <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
                        {previewUrl ? (
                          <img src={previewUrl} className="w-full h-full object-cover rounded-lg" alt="Preview" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-[#1e293b] truncate">{fileName}</p>
                        <div className="w-full h-1 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                          <div className="w-[100%] h-full bg-primary" />
                        </div>
                      </div>
                      <button 
                        onClick={removeImage}
                        className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Vendor & Status */}
              <div className="bg-white rounded-xl border border-primary/10 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-50 rounded-lg text-[#1e293b]">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h2 className="text-[16px] font-bold text-[#1e293b]">Vendor & Status</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-[#475569]">Vendor <span className="text-rose-500">*</span></label>
                    <Controller
                      control={control}
                      name="supplier_id"
                      render={({ field }) => (
                        <Select2
                          options={vendorOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select vendor name"
                          className={errors.supplier_id ? "border-rose-500" : ""}
                        />
                      )}
                    />
                    {errors.supplier_id && <span className="text-rose-500 text-[11px] font-medium">{errors.supplier_id.message}</span>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[13px] font-semibold text-[#475569]">Status</label>
                    <div 
                      onClick={() => setValue('status', status == 1 ? 0 : 1, { shouldDirty: true })}
                      className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg cursor-pointer group hover:bg-gray-100 transition-all"
                    >
                      <span className="text-[13px] font-medium text-[#1e293b]">
                        Active Product
                      </span>
                      <div className={clsx(
                        "w-10 h-5 rounded-full relative transition-colors duration-200",
                        status == 1 ? "bg-[#1e4ba1]" : "bg-gray-300"
                      )}>
                        <div className={clsx(
                          "absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200",
                          status == 1 ? "left-6" : "left-1"
                        )} />
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium">Inactive products are hidden from the storefront.</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="flex-1 h-[44px] bg-white border border-gray-200 text-[#1e293b] font-bold rounded-lg hover:bg-gray-50 transition-all text-[14px] shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 h-[44px] bg-[#0d7a50] hover:bg-[#0a6642] text-white font-bold rounded-lg transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 text-[14px]"
                >
                  {isSaving ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Check className="h-4 w-4" strokeWidth={3} /> Save</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <ConfirmationModal
        isOpen={isDiscardModalOpen}
        onClose={() => setIsDiscardModalOpen(false)}
        onConfirm={() => navigate({ to: '/inventory/product' })}
        title="Discard Progress?"
        message="You have unsaved product data. Are you sure you want to leave this page?"
        confirmText="Yes, Discard"
        variant="danger"
      />
    </div>
  )
}
