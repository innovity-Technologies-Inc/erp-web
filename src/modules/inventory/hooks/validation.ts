import { z } from 'zod'

export const termSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  status: z.union([z.number(), z.boolean(), z.string()]).optional().default(1),
})

export type TermFormValues = z.infer<typeof termSchema>

export const contactUsReplySchema = z.object({
  replay_message: z.string().min(1, 'Reply message is required'),
})

export type ContactUsReplyValues = z.infer<typeof contactUsReplySchema>

export const saleSchema = z.object({
  warehouse_id: z.number({ required_error: 'Warehouse is required' }),
  customer_id: z.number({ required_error: 'Customer is required' }),
  date: z.string().min(1, 'Date is required'),
  items: z.array(z.object({
    product_id: z.number(),
    batch_master_id: z.number(),
    quantity: z.number().min(0.01, 'Qty must be > 0'),
    rate: z.number().min(0, 'Rate must be >= 0'),
    discount_per: z.number().optional().default(0),
    discount: z.number().optional().default(0),
    vat_amnt: z.number().optional().default(0),
    vat_per: z.number().optional().default(0),
    total_price: z.number().optional().default(0),
    description: z.string().optional(),
    unit: z.string().optional(),
    avl_qty: z.number().optional(),
  })).min(1, 'At least one item is required'),
  payment_type_id: z.union([z.number(), z.string()]).optional(),
  payment_amount: z.number().optional().default(0),
  paid_amount: z.number().optional().default(0),
  grand_total: z.number().optional().default(0),
  total_discount: z.number().optional().default(0),
  invoice_discount: z.number().optional().default(0),
  due_amount: z.number().optional().default(0),
  shipping_cost: z.number().optional().default(0),
  previous: z.number().optional().default(0),
  details: z.string().optional(),
  description: z.string().optional(),
})

export type SaleFormValues = z.infer<typeof saleSchema>

export const supplierSchema = z.object({
  supplier_name: z.string().min(1, 'Vendor name is required'),
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
  status: z.union([z.number(), z.string()]).optional().default(1),
})

export type SupplierFormValues = z.infer<typeof supplierSchema>

