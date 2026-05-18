# Sale Module Logic Analysis (Legacy Blade -> React)

This document captures the business logic, data loading patterns, and calculation rules extracted from the legacy Laravel Blade templates for the Sale Create and Edit pages.

## 1. Data Loading & API Integration

### Initial Select2 Endpoints
*   **Warehouse:** `GET /api/select2/get-warehouse-select2`
*   **Merchant (Customer):** `GET /api/select2/get-customer-select2?customer_name={term}`
*   **Payment Type:** `GET /api/select2/get-payment-methods-select2`
*   **Product:** `GET /api/select2/get-product-select2?product_name={term}`

### Dependent Data Loading
*   **Customer Details:** When a Merchant is selected:
    *   `GET /api/inventory/merchant/get-data/{customerId}`
    *   **Updates:** `customer_phone`, `previous_due`, and `total-balance`.
*   **Product Batch Info:** When a Product is selected:
    *   `GET /api/inventory/products/get-invoice-info/{itemId}?warehouse_id={warehouseId}`
    *   **Returns:** `batchData` containing `avl_qty`, `unit`, `price`, and `no_of_qty`.
    *   **Condition:** Must select Warehouse before Product; otherwise, it triggers a warning.

## 2. Calculation Logic

### Row Level (`calculateRowTotal`)
*   `subtotal = quantity * rate`
*   `discountValue = subtotal * (discount_percentage / 100)`
*   `vatValue = subtotal * (vat_percentage / 100)` (VAT fields are currently hidden in UI but logic exists).
*   `row_total = subtotal - discountValue` (Note: In the legacy row calculation, VAT is calculated but not added to the individual row total variable, but it is added in the Grand Total).
*   `Per Pcs Rate = rate / no_of_qty` (Uses the `no_of_qty` from the batch data).

### Grand Total Level (`calculateGrandTotal`)
*   `totalAmount = sum(row_totals)`
*   `totalItemDiscount = sum(row_discount_values)`
*   `totalVatAmount = sum(row_vat_amounts)`
*   `totalDiscount = totalItemDiscount + invoice_discount`
*   `grandTotal = totalAmount + shipping_cost - invoice_discount + totalVatAmount`
*   `netTotal = grandTotal + previous_due`
*   `dueAmount = netTotal - paid_amount`
*   `totalBalance = dueAmount + merchant_previous_due`

## 3. Mandatory Fields & Validation

### Required Fields
*   `warehouse_id` (Dropdown)
*   `customer_id` (Dropdown)
*   `date` (Default: Today)
*   `items` (At least one valid row)
    *   `product_id`
    *   `batch_master_id`
    *   `quantity` (> 0)
    *   `rate` (> 0)

### UI Conditions
*   **Warehouse Change:** If the warehouse changes, all existing items, batches, and quantities are cleared to prevent stock-location mismatches.
*   **Credit Sale:** If `payment_type_id` is 0 (typically "Credit Sale"), the `paid_amount` is automatically set to 0 and recalculates the grand total.
*   **Read-Only Fields:** `avl_qty`, `unit`, `per_pcs_rate`, and `row_total` are computed and read-only.

## 4. Save Logic (Submission Data Structure)

*   **Endpoint (Create):** `POST /api/inventory/sales/store`
*   **Endpoint (Edit):** `POST /api/inventory/sales/update/{uuid}`
*   **Payload:**
    ```json
    {
        "warehouse_id": "...",
        "customer_id": "...",
        "date": "...",
        "details": "...", // CKEditor Content
        "items": [
            {
                "product_id": "...",
                "description": "...",
                "batch_master_id": "...",
                "available_qty": "...",
                "quantity": "...",
                "rate": "...",
                "discount_per": "...",
                "discount": "...", // Calculated Value
                "vat_per": "...",
                "vat_amnt": "...", // Calculated Value
                "total_price": "..."
            }
        ],
        "invoice_discount": "...",
        "total_discount": "...",
        "shipping_cost": "...",
        "total_vat_amnt": "...",
        "grand_total": "...",
        "previous": "...",
        "net_total": "...",
        "paid_amount": "...",
        "due_amount": "...",
        "payment_type_id": "...",
        "payment_amount": "..."
    }
    ```

## 5. List Logic (Sales Index)

### Data Table Integration
*   **Endpoint:** `GET /api/inventory/api/sales/datatable`
*   **Columns:** 
    *   Invoice No
    *   Sales By
    *   Channel
    *   Merchant Name
    *   Date
    *   Delivery Status (Pending, Confirmed, Picked Up, On The Way, Delivered, Cancelled)
    *   Delivery Note
    *   Total Amount
    *   Voucher Status (Approved/Unapproved)

### Action Conditions
*   **View:** Always available.
*   **Edit:** Restricted if `is_voucher_approved == 1`.
*   **Update Delivery:** Triggers a modal to update `delivery_status` and `delivery_note`.
    *   **Endpoint:** `POST /api/inventory/sales/update-delivery-status`

## 6. Payment List Logic (Invoice Payment List)

### Data Table Integration
*   **Endpoint:** `GET /api/inventory/api/sales/invoice_payment_list_datatable`
*   **Columns:**
    *   Date
    *   Payment Ref
    *   Transaction Ref
    *   Approved By
    *   Invoice No
    *   Merchant Name
    *   Total Amount
    *   Paid Amount
    *   Due Amount
    *   Status (Selectable: Unapproved, Approved, Pending)

### Status Management
*   **Confirm Status Update:** Users can change the status directly in the list row via a dropdown.
    *   **Endpoint:** `POST /api/inventory/sales/update-confirm-status`
    *   **Params:** `uuid`, `value` (0, 1, or 2)

## 7. Visual Consistency & Formatting
*   **Currency:** All amounts formatted to 2 decimal places.
*   **Badges:** Statuses (Voucher/Payment/Delivery) use color-coded badges (Emerald for Approved, Rose for Pending/Cancelled, etc.).
