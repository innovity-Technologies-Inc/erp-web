import { z } from 'zod'

export const termSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  status: z.union([z.number(), z.boolean(), z.string()]).default(1),
})

export type TermFormValues = z.infer<typeof termSchema>

export const contactUsReplySchema = z.object({
  replay_message: z.string().min(1, 'Reply message is required'),
})

export type ContactUsReplyValues = z.infer<typeof contactUsReplySchema>

export const saleSchema = z.object({
  warehouse_id: z.coerce.number().min(1, 'Warehouse is required'),
  customer_id: z.coerce.number().min(1, 'Customer is required'),
  date: z.string().min(1, 'Date is required'),
  items: z.array(z.object({
    product_id: z.number(),
    batch_master_id: z.number(),
    quantity: z.number().min(0.01, 'Qty must be > 0'),
    rate: z.number().min(0, 'Rate must be >= 0'),
    discount_per: z.number().default(0),
    discount: z.number().default(0),
    vat_amnt: z.number().default(0),
    vat_per: z.number().default(0),
    total_price: z.number().default(0),
    description: z.string().optional(),
    unit: z.string().optional(),
    avl_qty: z.number().optional(),
  })).min(1, 'At least one item is required'),
  payment_type_id: z.union([z.number(), z.string()]).optional(),
  payment_amount: z.number().default(0),
  paid_amount: z.number().default(0),
  grand_total: z.number().default(0),
  total_discount: z.number().default(0),
  invoice_discount: z.number().default(0),
  due_amount: z.number().default(0),
  shipping_cost: z.number().default(0),
  previous: z.number().default(0),
  details: z.string().optional(),
  description: z.string().optional(),
})

export type SaleFormValues = z.infer<typeof saleSchema>

export const supplierSchema = z.object({
  supplier_name: z.string().min(1, 'Vendor name is required'),
  last_name: z.string().optional(),
  vat_no: z.string().optional(),
  mobile: z.string().optional().or(z.literal('')),
  emailnumber: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  address2: z.string().optional(),
  contact: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  details: z.string().optional(),
  status: z.union([z.number(), z.string()]).default(1),
})

export type SupplierFormValues = z.infer<typeof supplierSchema>

export const merchantSchema = z.object({
  customer_name: z.string().min(1, 'Merchant name is required'),
  customer_mobile: z.string().min(1, 'Mobile number is required'),
  customer_email: z.string().email('Invalid email address').min(1, 'Email is required'),
  email_address: z.string().email('Invalid secondary email').optional().or(z.literal('')),
  vat_no: z.string().optional(),
  contact: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  customer_address: z.string().optional(),
  address2: z.string().optional(),
  sales_permit_number: z.string().optional(),
  sales_permit: z.any().optional(),
  status: z.union([z.number(), z.string()]).default(1),
  // Commission
  comission_value: z.string().optional().or(z.number().transform(v => String(v))),
  comission_type: z.union([z.number(), z.string()]).default(1),
  comission_note: z.string().optional(),
  // Auth
  password_option: z.string().optional(),
  password: z.string().optional(), // Will handle conditional requirement in component or refined schema
})

export type MerchantFormValues = z.infer<typeof merchantSchema>

export const warehouseSchema = z.object({
  warehouse_code: z.string().min(1, 'Warehouse code is required'),
  name: z.string().min(1, 'Warehouse name is required'),
  contact_person: z.union([z.string(), z.number()]).optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  address_line1: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.union([z.number(), z.string()]).default(1),
})

export type WarehouseFormValues = z.infer<typeof warehouseSchema>

export const stockMovementSchema = z.object({
  from_warehouse_id: z.coerce.number().min(1, 'From Warehouse is required'),
  to_warehouse_id: z.coerce.number().min(1, 'To Warehouse is required'),
  movement_category: z.string().min(1, 'Category is required'),
  movement_type: z.coerce.number().min(1, 'Type is required'),
  reference_no: z.string().optional(),
  remark: z.string().optional(),
  batches: z.array(z.object({
    batch_master_id: z.coerce.number().min(1, 'Batch is required'),
    items: z.array(z.object({
      product_id: z.coerce.number().min(1, 'Product is required'),
      quantity: z.coerce.number().min(0.01, 'Qty must be > 0'),
      avl_qty: z.coerce.number().optional(),
    })).min(1, 'At least one item per batch is required'),
  })).min(1, 'At least one batch is required'),
})

export type StockMovementFormValues = z.infer<typeof stockMovementSchema>

export const unitSchema = z.object({
  unit_name: z.string().min(1, 'Unit name is required'),
  status: z.union([z.number(), z.boolean(), z.string()]).default(1),
})

export type UnitFormValues = z.infer<typeof unitSchema>

export const productCategorySchema = z.object({
  category_name: z.string().min(1, 'Category name is required'),
  parent_id: z.union([z.number(), z.string()]).optional().nullable(),
  status: z.union([z.number(), z.boolean(), z.string()]).default(1),
})

export type ProductCategoryFormValues = z.infer<typeof productCategorySchema>

export const purchaseSchema = z.object({
  supplier_id: z.coerce.number().min(1, 'Vendor is required'),
  purchase_date: z.string().min(1, 'Purchase date is required'),
  chalan_no: z.string().min(1, 'Chalan number is required'),
  batch_no: z.string().min(1, 'Batch number is required'),
  invoice_file: z.any().optional(),
  
  items: z.array(z.object({
    item_id: z.coerce.number().min(1, 'Item is required'),
    expiry_date: z.string().optional(),
    rate: z.coerce.number().min(0, 'Rate must be >= 0'),
    discount_percent: z.coerce.number().min(0).max(100).default(0),
    discount_value: z.coerce.number().default(0),
    total: z.coerce.number().default(0),
    
    warehouses: z.array(z.object({
      warehouse_id: z.coerce.number().min(1, 'Warehouse is required'),
      quantity: z.coerce.number().min(1, 'Qty must be >= 1')
    })).min(1, 'At least one warehouse is required'),
  })).min(1, 'At least one item is required'),
  
  details: z.string().optional(),
  purchase_discount: z.coerce.number().default(0),
  paid_amount: z.coerce.number().default(0),
  payment_type_id: z.union([z.coerce.number(), z.string()]).optional(),
})

export type PurchaseFormValues = z.infer<typeof purchaseSchema>

export const productSchema = z.object({
  product_id: z.string().optional().nullable(),
  product_name: z.string().min(1, 'Product name is required'),
  category_id: z.coerce.number().optional().nullable(),
  supplier_id: z.coerce.number().min(1, 'Supplier is required'),
  unit_id: z.coerce.number().optional().nullable(),
  model: z.string().optional().nullable(),
  price: z.coerce.number().optional().nullable(),
  supplier_price: z.coerce.number().optional().nullable(),
  per_pcs_price: z.coerce.number().optional().nullable(),
  no_of_qty: z.coerce.number().optional().nullable(),
  serial_no: z.string().optional().nullable(),
  product_vat: z.coerce.number().optional().nullable(),
  product_details: z.string().optional().nullable(),
  image: z.any().optional().nullable(),
  status: z.union([z.number(), z.boolean()]).default(1),
  main_category_id: z.coerce.number().min(1, 'Main Category is required'),
})

export type ProductFormValues = z.infer<typeof productSchema>

export const vendorReturnSchema = z.object({
  supplier_id: z.coerce.number().min(1, 'Vendor is required'),
  purchase_id: z.coerce.number().min(1, 'Invoice is required'),
  return_date: z.string().min(1, 'Return date is required'),
  payment_type_id: z.coerce.number().min(1, 'Payment Type is required'),
  items: z.array(z.object({
    purchase_detail_id: z.number(),
    item_id: z.number(),
    product_name: z.string(),
    batch_no: z.string(),
    quantity: z.number(),
    available_quantity: z.number(),
    return_quantity: z.number().min(0.01, 'Return qty must be > 0'),
    rate: z.number(),
    deduction_percent: z.number().min(0).max(100).default(0),
    deduction_value: z.number().default(0),
    total: z.number().default(0),
    selected: z.boolean().default(false),
  })).superRefine((items, ctx) => {
    items.forEach((item, index) => {
      if (item.selected && item.return_quantity > item.available_quantity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Return quantity cannot exceed available quantity (${item.available_quantity})`,
          path: [index, 'return_quantity']
        })
      }
    })
  }).refine(items => items.some(item => item.selected), {
    message: 'Please select at least one item to return'
  }),
  details: z.string().optional(),
  primary_category: z.string().optional(),
  total_deduction: z.number().default(0),
  grand_total: z.number().default(0),
})

export type VendorReturnFormValues = z.infer<typeof vendorReturnSchema>


