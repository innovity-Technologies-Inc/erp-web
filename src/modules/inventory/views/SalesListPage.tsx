import { useMemo, useState } from 'react'
import { DataTable } from '@/components/DataTable/DataTable'
import { Button } from '@/components/Button/Button'
import { Plus, Edit, Trash2, Search, Eye, Filter } from 'lucide-react'
import { useSalesDatatable, useDeleteSale } from '../hooks/useSales'
import type { ColDef } from 'ag-grid-community'
import type { SaleListItem } from '../api/sales.api'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useSettings } from '@/hooks/useSettings'

export const SalesListPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const { currency, currencyPosition } = useSettings()
  
  // DataTables params
  const params = useMemo(() => ({
    draw: 1,
    start: 0,
    length: 100,
    search: { value: searchTerm, regex: false },
  }), [searchTerm])

  const { data: salesData, isLoading } = useSalesDatatable(params)
  const { mutate: deleteSale } = useDeleteSale()

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteSale(id)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-success/10 text-success'
      case 'Confirmed': return 'bg-blue-100 text-blue-700'
      case 'On The Way': return 'bg-orange-100 text-orange-700'
      case 'Picked Up': return 'bg-purple-100 text-purple-700'
      case 'Cancelled': return 'bg-danger/10 text-danger'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const columnDefs = useMemo<ColDef<SaleListItem>[]>(() => [
    { 
      headerName: 'Invoice ID', 
      field: 'invoice_id',
      width: 130,
      flex: 0,
      pinned: 'left',
      cellStyle: { fontWeight: '600', color: 'var(--color-primary)' }
    },
    { 
      headerName: 'Date', 
      field: 'date',
      width: 120,
      flex: 0,
      valueFormatter: (params) => formatDate(params.value)
    },
    { 
      headerName: 'Customer', 
      field: 'customer_name',
      flex: 1.5
    },
    { 
      headerName: 'Sales By', 
      field: 'sales_by',
      flex: 1
    },
    { 
      headerName: 'Total Amount', 
      field: 'total_amount',
      width: 140,
      flex: 0,
      headerClass: 'text-right',
      cellStyle: { textAlign: 'right', fontWeight: '600' },
      valueFormatter: (params) => formatCurrency(params.value, currency, currencyPosition)
    },
    { 
      headerName: 'Delivery', 
      field: 'delivery_status_text',
      width: 130,
      flex: 0,
      cellRenderer: (params: any) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${getStatusColor(params.value)}`}>
          {params.value}
        </span>
      )
    },
    { 
      headerName: 'Voucher', 
      field: 'status',
      width: 130,
      flex: 0,
      cellRenderer: (params: any) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
          params.value === 'Approved' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
        }`}>
          {params.value}
        </span>
      )
    },
    {
      headerName: 'Action',
      field: 'id',
      width: 130,
      flex: 0,
      sortable: false,
      filter: false,
      pinned: 'right',
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-1.5">
          <button 
            title="View Details"
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button 
            title="Edit"
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button 
            title="Delete"
            onClick={() => handleDelete(params.value)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ], [currency, currencyPosition])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Sales</h1>
          <p className="text-sm text-gray-500">View and manage all sales invoices</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Sale
        </Button>
      </div>

      {/* Filters/Actions */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Invoice ID, Customer..."
            className="erp-input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="flex items-center gap-2 text-xs py-2">
             <Filter className="h-3.5 w-3.5" />
             More Filters
           </Button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        rowData={salesData?.data}
        columnDefs={columnDefs}
        isLoading={isLoading}
        autoHeight
      />
    </div>
  )
}
