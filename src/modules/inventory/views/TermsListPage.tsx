import { useMemo, useState } from 'react'
import { Edit, Eye } from 'lucide-react'
import { useTermsDatatable, useDeleteTerm } from '../hooks/useTerms'
import type { ColDef } from 'ag-grid-community'
import type { TermListItem } from '../api/terms.api'
import { TermModal } from '../components/TermModal'
import { clsx } from 'clsx'
import { ListPageLayout, type NavTab } from '@/components/ListPageLayout/Listpagelayout'

const tabs: NavTab[] = [
  { name: 'Manage Sale',          to: '/inventory/sales' },
  { name: 'Manage Sales Payment', to: '/inventory/sales/payments' },
  { name: 'Manage Sales Terms',   to: '/inventory/terms', active: true },
  { name: 'Manage Contact Us',    to: '/inventory/contact-us' },
]

export const TermsListPage = () => {
  const [searchTerm, setSearchTerm]   = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize]       = useState(10)

  const params = useMemo(() => ({
    draw:   1,
    start:  (currentPage - 1) * pageSize,
    length: pageSize,
    search: { value: searchTerm, regex: false },
  }), [searchTerm, currentPage, pageSize])

  const { data: termsData, isLoading } = useTermsDatatable(params)
  const { mutate: deleteTerm } = useDeleteTerm()

  const handleEdit = (id: number) => {
    setSelectedTermId(id)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setSelectedTermId(null)
    setIsModalOpen(true)
  }

  const totalPages = Math.ceil((termsData?.recordsTotal ?? 0) / pageSize)

  const columnDefs = useMemo<ColDef<TermListItem>[]>(() => [
    {
      headerName: 'SL',
      valueGetter: 'node.rowIndex + 1',
      width: 80,
      flex: 0,
      pinned: 'left',
      cellClass: 'text-gray-400 font-medium border-r border-gray-50 flex items-center justify-center',
    },
    {
      headerName: 'DATE',
      field: 'id',
      width: 140,
      flex: 0,
      valueFormatter: () => '2026-04-27',
      cellClass: 'text-[#475569] font-medium',
    },
    {
      headerName: 'DESCRIPTION',
      field: 'description',
      flex: 1,
      cellRenderer: (params: any) => (
        <div className="line-clamp-1 py-2 text-[#475569] font-normal" title={params.value}>
          {params.value}
        </div>
      ),
    },
    {
      headerName: 'STATUS',
      field: 'status',
      width: 140,
      flex: 0,
      cellRenderer: (params: any) => {
        const status = params.value
        const isActive = status === 'Approved' || status === 'Active'
        return (
          <span className={clsx(
            'px-4 py-1 rounded-full text-[12px] font-bold tracking-tight',
            isActive ? 'bg-[#dbeafe] text-[#1e4ba1]' : 'bg-[#f1f5f9] text-[#94a3b8]'
          )}>
            {status}
          </span>
        )
      },
    },
    {
      headerName: 'ACTION',
      field: 'id',
      width: 120,
      flex: 0,
      sortable: false,
      filter: false,
      pinned: 'right',
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center gap-4 h-full">
          <button className="text-[#3b82f6] hover:scale-110 transition-transform" title="View">
            <Eye className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleEdit(params.value)}
            className="text-[#10b981] hover:scale-110 transition-transform"
            title="Edit"
          >
            <Edit className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ], [])

  return (
    <>
      <ListPageLayout<TermListItem>
        title="Sales Terms & Conditions"
        backTo="/inventory/sales"
        tabs={tabs}
        onCreate={handleAdd}
        showStatusFilter={true}
        showColumnFilter={true}
        rowData={termsData?.data}
        columnDefs={columnDefs}
        isLoading={isLoading}
        recordsTotal={termsData?.recordsTotal ?? 0}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
        searchValue={searchTerm}
        onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1) }}
      />

      <TermModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        termId={selectedTermId}
      />
    </>
  )
}