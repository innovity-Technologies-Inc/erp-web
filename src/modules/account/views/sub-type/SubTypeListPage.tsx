import { useState, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { useSubTypeDatatable } from '../../hooks/useSubType'
import type { SubTypeListItem } from '../../api/sub-type.api'

export const SubTypeListPage = () => {
  // Pagination & Search States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')

  // Fetch data
  const params = useMemo(() => ({
    draw: 1,
    start: 0,
    length: 1000,
    search: { value: '' } // Fetch all and filter client-side
  }), [])

  const { data: rawDataResponse, isLoading } = useSubTypeDatatable(params)

  // Client-Side Filtering
  const filteredRowData = useMemo(() => {
    let rows = rawDataResponse?.data || []

    if (search) {
      const lowerSearch = search.toLowerCase()
      rows = rows.filter(r => r.sub_type_name.toLowerCase().includes(lowerSearch))
    }

    return rows
  }, [rawDataResponse, search])

  // Paginated chunk to display in AG Grid
  const displayRowData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredRowData.slice(startIndex, startIndex + pageSize)
  }, [filteredRowData, currentPage, pageSize])

  const totalPages = Math.ceil(filteredRowData.length / pageSize)

  // AG Grid Columns
  const columnDefs = useMemo<ColDef<SubTypeListItem>[]>(() => [
    {
      headerName: 'SL',
      width: 100,
      valueGetter: (params) => {
        if (!params.node?.rowIndex && params.node?.rowIndex !== 0) return ''
        return String((currentPage - 1) * pageSize + params.node.rowIndex + 1)
      },
    },
    {
      headerName: 'SUB TYPE NAME',
      field: 'sub_type_name',
      flex: 1,
      minWidth: 300,
      cellClass: 'font-semibold text-[#1e293b]',
    }
  ], [currentPage, pageSize])

  const tabs = [
    { name: 'Accounts', to: '/account/chart-of-accounts', active: true },
    { name: 'Report', to: '/account/reports', active: false },
    { name: 'EIN', to: '/account/ein', active: false },
  ]

  const navOptions = [
    { name: 'Chart of Accounts', to: '/account/chart-of-accounts' },
    { name: 'Account Sub Type', to: '/account/sub-type' },
    { name: 'Sub Account Manage', to: '/account/sub-account' },
    { name: 'Financial Year Manage', to: '/account/financial-year' },
    { name: 'Opening Balance', to: '/account/opening-balance' },
    { name: 'Debit Voucher', to: '/account/voucher/debit' },
    { name: 'Credit Voucher', to: '/account/voucher/credit' },
    { name: 'Contra Voucher', to: '/account/voucher/contra' },
    { name: 'Journal Voucher', to: '/account/voucher/journal' },
    { name: 'Bank Reconciliation', to: '/account/bank-reconciliation' },
    { name: 'Payment Method', to: '/account/payment-method' },
    { name: 'Vendor Payment', to: '/account/vendor-payment' },
    { name: 'Merchant Receive', to: '/account/merchant-receive' },
    { name: 'Service Payment', to: '/account/service-payment' },
    { name: 'Cash Adjustment', to: '/account/cash-adjustment' },
    { name: 'Voucher Approval', to: '/account/voucher-approval' },
  ]

  return (
    <ListPageLayout<SubTypeListItem>
      title="Account Sub Type"
      titleOptions={navOptions}
      tabs={tabs}
      backTo="/account/chart-of-accounts"
      showSearch={true}
      searchValue={search}
      onSearchChange={(val) => { setSearch(val); setCurrentPage(1) }}
      isLoading={isLoading}
      // AG Grid Table Props
      rowData={displayRowData}
      columnDefs={columnDefs}
      // Pagination Meta
      recordsTotal={filteredRowData.length}
      currentPage={currentPage}
      pageSize={pageSize}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
      showStatusFilter={false}
      showColumnFilter={false}
    />
  )
}
