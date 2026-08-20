import { useMemo, useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import type { ColDef } from 'ag-grid-community'
import type { Role } from '../../api/types'
import { useRolesDatatable, useDeleteRole } from '../../hooks/useRoles'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { usePermissions } from '@/hooks/usePermissions'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { clsx } from 'clsx'
import { exportToExcel } from '@/utils/exportUtils'

export const RoleListPage = () => {
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()
  const navigate = useNavigate()

  // States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    name: true,
    assigned_modules: true,
    permissions: true,
    action: true,
  })

  // Data Fetching params
  const params = useMemo(
    () => ({
      draw: currentPage,
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      'search[value]': search || undefined,
    }),
    [currentPage, pageSize, search]
  )

  const { data: rolesData, isLoading } = useRolesDatatable(params)
  const { mutate: deleteRoleMutation, isPending: isDeleting } = useDeleteRole()



  // Navigation handlers
  const handleAdd = () => {
    navigate({ to: '/role/create' })
  }

  const handleEdit = (id: number) => {
    navigate({ to: '/role/edit/$uuid', params: { uuid: String(id) } })
  }

  const handleDeleteClick = (id: number) => {
    setRoleToDelete(id)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (roleToDelete) {
      deleteRoleMutation(roleToDelete, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setRoleToDelete(null)
          showNotificationModal(
            'Role Deleted!',
            'The role has been removed successfully.',
            'success'
          )
        },
        onError: (error: any) => {
          const msg = error.response?.data?.message || error.message || 'Failed to delete role.'
          showNotificationModal('Delete Failed', msg, 'error')
        },
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const handleExport = () => {
    if (!rolesData?.data) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'Role Name', key: 'name', width: 25 },
      { header: 'Permissions Grouped', key: 'permissions', width: 50 },
    ]

    const exportData = rolesData.data.map((item: any, index: number) => {
      const grouped = item.permissions_grouped || {}
      const permissionsString = Object.keys(grouped)
        .map((mod) => `${mod}: ${(grouped[mod] || []).join(', ')}`)
        .join(' | ')

      return {
        sl: index + 1,
        name: item.name,
        permissions: permissionsString,
      }
    })

    exportToExcel(exportData, exportColumns, 'roles-list')
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<Role>[]>(
    () => [
      {
        headerName: 'SL',
        valueGetter: (params) => {
          const index = params.node?.rowIndex ?? 0
          return (currentPage - 1) * pageSize + index + 1
        },
        width: 80,
        pinned: 'left',
        hide: !visibleCols.sl,
        cellClass: 'text-gray-400 font-medium border-r border-primary/10 flex items-center justify-center',
      },
      {
        headerName: 'ROLE NAME',
        field: 'name',
        width: 130,
        hide: !visibleCols.name,
        cellClass: 'font-semibold text-gray-700 flex items-center',
      },
      {
        headerName: 'ASSIGNED MODULES',
        field: 'permissions',
        width: 120,
        autoHeight: true,
        wrapText: true,
        hide: !visibleCols.assigned_modules,
        cellClass: 'px-3 whitespace-normal border-r border-gray-100 py-1.5',
        cellRenderer: (params: any) => {
          if (params.data.name === 'System Administrator') {
            return (
              <div className="flex items-center h-full">
                <span className="inline-flex items-center justify-center h-[22px] px-3 rounded-full text-[11px] font-medium tracking-tight uppercase bg-[#1E3A5F] text-white leading-none">
                  All Modules
                </span>
              </div>
            )
          }
          
          const grouped = params.data.permissions_grouped || {}
          const modules = Object.keys(grouped)

          if (modules.length === 0) return <span className="text-gray-300">—</span>

          return (
            <div className="flex flex-col gap-1 w-full justify-start">
              {modules.map((mod) => (
                <div key={mod} className="flex flex-wrap gap-1 min-h-[22px] items-center">
                  <span className="inline-flex items-center justify-center h-[22px] px-3 rounded-full text-[11px] font-medium tracking-tight uppercase bg-[#eff6ff] text-blue-600 border border-blue-100 leading-none">
                    {mod}
                  </span>
                </div>
              ))}
            </div>
          )
        },
      },
      {
        headerName: 'PERMISSIONS',
        field: 'permissions',
        minWidth: 550,
        flex: 1,
        autoHeight: true,
        wrapText: true,
        hide: !visibleCols.permissions,
        cellClass: 'py-1.5 px-3 whitespace-normal',
        cellRenderer: (params: any) => {
          if (params.data.name === 'System Administrator') {
            return (
              <div className="flex items-center h-full">
                <span className="inline-flex items-center justify-center h-[22px] px-3 rounded-full text-[11px] font-medium tracking-tight uppercase bg-blue-600 text-white leading-none">
                  Full Access
                </span>
              </div>
            )
          }
          
          const grouped = params.data.permissions_grouped || {}
          const modules = Object.keys(grouped)

          if (modules.length === 0) return <span className="text-gray-300">—</span>

          return (
            <div className="flex flex-col gap-1 w-full justify-start">
              {modules.map((mod) => (
                <div key={mod} className="flex flex-wrap gap-1 min-h-[22px] items-center">
                  {grouped[mod].map((perm: string) => (
                    <span
                      key={perm}
                      className="inline-flex items-center justify-center h-[22px] px-3 rounded-full text-[11px] font-medium tracking-tight uppercase bg-gray-50 text-gray-600 border border-gray-200 leading-none"
                    >
                      {perm.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )
        },
      },
      {
        headerName: 'ACTION',
        width: 100,
        pinned: 'right',
        hide: !visibleCols.action || !hasAnyPermission(['edit_role', 'delete_role']),
        cellClass: 'flex items-center justify-center gap-2',
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-2 h-full">
            <PermissionGuard permission="edit_role">
              <button
                onClick={() => handleEdit(params.data.id)}
                className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                title="Edit Role"
              >
                <Edit className="h-4 w-4" />
              </button>
            </PermissionGuard>

            <PermissionGuard permission="delete_role">
              <button
                onClick={() => handleDeleteClick(params.data.id)}
                className="p-1 text-gray-500 hover:text-rose-600 transition-colors"
                title="Delete Role"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </PermissionGuard>
          </div>
        ),
      },
    ],
    [currentPage, pageSize, visibleCols]
  )

  const filterColumns = [
    { name: 'SL', field: 'sl', visible: visibleCols.sl },
    { name: 'Role Name', field: 'name', visible: visibleCols.name },
    { name: 'Assigned Modules', field: 'assigned_modules', visible: visibleCols.assigned_modules },
    { name: 'Permissions', field: 'permissions', visible: visibleCols.permissions },
    { name: 'Actions', field: 'action', visible: visibleCols.action },
  ]

  const totalPages = Math.ceil((rolesData?.recordsFiltered ?? 0) / pageSize)

  const tabs = [
    { name: 'User Management', to: '/user' },
    { name: 'Role', to: '/role', active: true },
  ]

  return (
    <>
      <ListPageLayout
        title="Role List"
        backTo="/"
        tabs={tabs}
        searchWidth="max-w-[200px]"
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        isLoading={isLoading}
        onCreate={handleAdd}
        createPermission="create_role"
        // AG Grid Props
        rowData={rolesData?.data || []}
        columnDefs={columnDefs}
        // Pagination
        recordsTotal={rolesData?.recordsFiltered || 0}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
        // Column Filter
        showColumnFilter={true}
        columns={filterColumns}
        onColumnToggle={toggleColumn}
        // Export
        onExport={handleExport}
        gridOptions={{
          getRowHeight: (params: any) => {
            if (!params.data) return 36
            if (params.data.name === 'System Administrator') return 46
            const grouped = params.data.permissions_grouped || {}
            const modulesCount = Object.keys(grouped).length
            if (modulesCount === 0) return 36

            const itemHeight = 22
            const badgeLineGap = 4
            const moduleGap = 4
            const basePadding = 18

            // Calculate height of the modules column: each module is 22px + gap (4px)
            const modulesColumnHeight = modulesCount * itemHeight + (modulesCount - 1) * moduleGap + basePadding

            // Calculate height of the permissions column based on simulated character-wrap
            let permissionsColumnHeight = basePadding
            Object.keys(grouped).forEach((mod, index) => {
              const perms = grouped[mod] || []
              let currentLineLength = 0
              let linesCount = 1
              const maxLineLength = 450 // Aligned with the column's 550px minWidth

              perms.forEach((perm: string) => {
                const cleanName = perm.replace(/_/g, ' ')
                // width estimation: charCount * 5.2px + 24px horizontal padding + 4px gap
                const badgeWidth = cleanName.length * 5.2 + 28
                if (currentLineLength + badgeWidth > maxLineLength) {
                  linesCount++
                  currentLineLength = badgeWidth
                } else {
                  currentLineLength += badgeWidth
                }
              })

              const moduleContentHeight = linesCount * itemHeight + (linesCount - 1) * badgeLineGap
              permissionsColumnHeight += moduleContentHeight

              if (index < modulesCount - 1) {
                permissionsColumnHeight += moduleGap
              }
            })

            // Take the max of both columns' content height
            return Math.max(46, modulesColumnHeight, permissionsColumnHeight)
          }
        }}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="Delete Role"
        message="Are you sure you want to delete this role? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onClose={() => setIsConfirmOpen(false)}
        confirmText="Yes, delete it"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </>
  )
}
