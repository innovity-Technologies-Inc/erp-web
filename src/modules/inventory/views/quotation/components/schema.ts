import * as z from 'zod'

const saleItemSchema = z.object({
  product_id: z.string().or(z.number()),
  batch_master_id: z.string().or(z.number()),
  description: z.string().optional().nullable(),
  available_qty: z.number().optional(),
  unit: z.string().optional(),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  rate: z.number().min(0, 'Rate cannot be negative'),
  discount_per: z.number().min(0).max(100).optional(),
  discount: z.number().optional(),
  vat_per: z.number().min(0).max(100).optional(),
  vat_amnt: z.number().optional(),
  total_price: z.number().optional(),
})

const serviceItemSchema = z.object({
  service_id: z.string().or(z.number()),
  qty: z.number().min(0.01, 'Quantity must be greater than 0'),
  charge: z.number().min(0, 'Charge cannot be negative'),
  discount: z.number().min(0).max(100).optional(),
  discount_value: z.number().optional(),
  vat: z.number().min(0).max(100).optional(),
  vat_amnt: z.number().optional(),
  total: z.number().optional(),
})

export const quotationSchema = z.object({
  warehouse_id: z.string().or(z.number()).refine((val) => val !== '', { message: 'Warehouse is required' }),
  customer_id: z.string().or(z.number()).refine((val) => val !== '', { message: 'Merchant is required' }),
  quotdate: z.string().min(1, 'Quotation Date is required'),
  expire_date: z.string().min(1, 'Expiry Date is required'),
  quot_description: z.string().optional().nullable(),
  
  // Totals
  item_total_amount: z.number().optional(),
  item_total_discount: z.number().optional(),
  item_total_vat: z.number().optional(),
  quot_dis_item: z.number().optional(),

  // Arrays
  sale_items: z.array(saleItemSchema).min(1, 'At least one product item is required'),
  
  // Service optional part
  selectService: z.boolean().optional(),
  service_items: z.array(serviceItemSchema).optional(),
  service_total_amount: z.number().optional(),
  service_total_discount: z.number().optional(),
  service_total_vat: z.number().optional(),
  quot_dis_service: z.number().optional(),

  // For add-to-invoice
  sale_payment_amount: z.number().optional(),
  sale_payment_type_id: z.string().or(z.number()).optional(),
  service_payment_amount: z.number().optional(),
  service_payment_type_id: z.string().or(z.number()).optional(),
})

export type QuotationFormValues = z.infer<typeof quotationSchema>
export type SaleItemFormValues = z.infer<typeof saleItemSchema>
export type ServiceItemFormValues = z.infer<typeof serviceItemSchema>
