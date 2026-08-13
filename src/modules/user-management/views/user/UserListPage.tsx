import { useMemo, useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useUsersDatatable, useDeleteUser } from '../../hooks/useUsers'
import type { ColDef } from 'ag-grid-community'
import type { UserListItem } from '../../api/types'
import { ListPageLayout } from '@/components/ListPageLayout/ListPageLayout'
import { ConfirmationModal } from '@/components/Modal/ConfirmationModal'
import { useUiStore } from '@/store/useUiStore'
import { usePermissions } from '@/hooks/usePermissions'
import { PermissionGuard } from '@/components/Permission/PermissionGuard'
import { exportToExcel } from '@/utils/exportUtils'


export const UserListPage = () => {
  const navigate = useNavigate()
  const { showNotificationModal } = useUiStore()
  const { hasAnyPermission } = usePermissions()

  // States for Pagination and Filters
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<number | null>(null)

  // Column Visibility State
  const [visibleCols, setVisibleColumns] = useState({
    sl: true,
    name: true,
    email: true,
    mobile: true,
    user_type: true,
    role: true,
    demo_user: true,
    action: true,
  })

  // API query parameters
  const params = useMemo(
    () => ({
      draw: 1,
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      search: { value: search },
      // Optional extra filters matching UI dropdowns
      user_type: userTypeFilter || undefined,
      role_id: roleFilter || undefined,
      start_date: dateRange.start || undefined,
      end_date: dateRange.end || undefined,
    }),
    [currentPage, pageSize, search, userTypeFilter, roleFilter, dateRange]
  )

  const { data: usersData, isLoading } = useUsersDatatable(params)
  const { mutate: deleteUserMutation, isPending: isDeleting } = useDeleteUser()

  // Actions
  const handleAdd = () => {
    navigate({ to: '/user/create' })
  }

  const handleEdit = (id: number) => {
    navigate({ to: '/user/edit/$uuid', params: { uuid: String(id) } })
  }

  const handleDeleteClick = (id: number) => {
    setUserToDelete(id)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (userToDelete !== null) {
      deleteUserMutation(userToDelete, {
        onSuccess: () => {
          setIsConfirmOpen(false)
          setUserToDelete(null)
          showNotificationModal('User Deleted!', 'The user has been deleted successfully.', 'success')
        },
        onError: (error: any) => {
          setIsConfirmOpen(false)
          setUserToDelete(null)
          const message = error.response?.data?.message || error.message || 'Failed to delete user.'
          showNotificationModal('Deletion Failed', message, 'error')
        },
      })
    }
  }

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const handleExport = () => {
    if (!usersData?.data) return

    const exportColumns = [
      { header: 'SL', key: 'sl', width: 8 },
      { header: 'User Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'Role', key: 'role', width: 20 },
      { header: 'User Type', key: 'userType', width: 15 },
    ]

    const exportData = usersData.data.map((item, index) => ({
      sl: index + 1,
      name: item.name,
      email: item.email,
      mobile: item.mobile,
      role: item.role_name,
      userType: item.user_type,
    }))

    exportToExcel(exportData, exportColumns, 'users-list')
  }

  // Helper to generate initials avatar
  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(/\s+/)
    return parts.map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  }

  // Helper to resolve profile image URL
  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    const storageUrl = import.meta.env.VITE_STORAGE_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') + '/storage' : 'http://localhost:5000/storage')
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
    return `${storageUrl}/${cleanPath}`
  }

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<UserListItem>[]>(
    () => [
      {
        headerName: 'SL',
        width: 60,
        pinned: 'left',
        valueGetter: (params) => {
          if (params.node?.rowIndex !== null && params.node?.rowIndex !== undefined) {
            return (currentPage - 1) * pageSize + params.node.rowIndex + 1
          }
          return null
        },
        cellClass: 'text-gray-400 font-medium border-r border-primary/10 flex items-center justify-center',
        hide: !visibleCols.sl,
      },
      {
        headerName: 'NAME',
        field: 'name',
        minWidth: 200,
        flex: 1.5,
        hide: !visibleCols.name,
        cellClass: 'font-semibold text-gray-700 flex items-center py-1.5',
        cellRenderer: (params: any) => {
          const user = params.data
          if (!user) return null
          const imgUrl = getImageUrl(user.image)
          
          return (
            <div className="flex items-center gap-3 w-full">
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-100"
                  onError={(e) => {
                    // Fallback to initials if image load fails
                    ;(e.target as HTMLImageElement).style.display = 'none'
                    const fallback = (e.target as HTMLImageElement).nextSibling as HTMLDivElement
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
              ) : null}
              {!imgUrl ? (
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0 uppercase">
                  {getInitials(user.name)}
                </div>
              ) : (
                <div
                  style={{ display: 'none' }}
                  className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0 uppercase"
                >
                  {getInitials(user.name)}
                </div>
              )}
              <span className="truncate">{user.name}</span>
            </div>
          )
        },
      },
      {
        headerName: 'EMAIL',
        field: 'email',
        minWidth: 180,
        flex: 1.5,
        hide: !visibleCols.email,
        cellClass: 'text-gray-600 flex items-center',
      },
      {
        headerName: 'MOBILE',
        field: 'mobile',
        width: 130,
        hide: !visibleCols.mobile,
        cellClass: 'text-gray-600 flex items-center',
      },
      {
        headerName: 'USER TYPE',
        field: 'user_type',
        width: 110,
        hide: !visibleCols.user_type,
        cellClass: 'text-gray-600 flex items-center',
      },
      {
        headerName: 'ROLE',
        field: 'role_name',
        minWidth: 150,
        flex: 1.2,
        hide: !visibleCols.role,
        cellRenderer: (params: any) => {
          const roleNames = params.data?.role_name ? params.data.role_name.split(', ') : []
          if (roleNames.length === 0) return <span className="text-gray-300">—</span>
          return (
            <div className="flex gap-1.5 items-center h-full">
              {roleNames.map((role: string) => (
                <span
                  key={role}
                  className="inline-flex items-center justify-center h-[22px] px-3 rounded-full text-[11px] font-medium tracking-tight uppercase bg-gray-50 text-gray-600 border border-gray-200 leading-none"
                >
                  {role}
                </span>
              ))}
            </div>
          )
        },
      },
      {
        headerName: 'DEMO USER',
        field: 'is_demo_user',
        width: 100,
        hide: !visibleCols.demo_user,
        cellClass: 'flex items-center justify-center',
        cellRenderer: (params: any) => {
          const isDemo = params.data?.is_demo_user === 1
          return (
            <div className="flex items-center justify-center h-full">
              <span
                className={`inline-flex items-center justify-center h-[22px] px-3 rounded-full text-[11px] font-medium tracking-tight uppercase leading-none ${
                  isDemo ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-50 text-gray-400 border border-gray-200'
                }`}
              >
                {isDemo ? 'Yes' : 'No'}
              </span>
            </div>
          )
        },
      },
      {
        headerName: 'ACTION',
        width: 100,
        pinned: 'right',
        hide: !visibleCols.action || !hasAnyPermission(['edit_user', 'delete_user']),
        cellClass: 'flex items-center justify-center gap-2',
        cellRenderer: (params: any) => {
          const user = params.data
          if (!user) return null
          
          // Super admin roles are locked on backend and cannot be edited or deleted
          if (user.role_name === 'super-admin') {
            return <span className="text-gray-300 text-[11px] font-medium italic">Locked</span>
          }

          return (
            <>
              <PermissionGuard permission="edit_user">
                <button
                  onClick={() => handleEdit(user.id)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit User"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </PermissionGuard>

              <PermissionGuard permission="delete_user">
                <button
                  onClick={() => handleDeleteClick(user.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete User"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </PermissionGuard>
            </>
          )
        },
      },
    ],
    [visibleCols, currentPage, pageSize, hasAnyPermission]
  )

  // Columns filter config list
  const filterColumns = useMemo(
    () => [
      { name: 'SL', field: 'sl', visible: visibleCols.sl },
      { name: 'Name', field: 'name', visible: visibleCols.name },
      { name: 'Email', field: 'email', visible: visibleCols.email },
      { name: 'Mobile', field: 'mobile', visible: visibleCols.mobile },
      { name: 'User Type', field: 'user_type', visible: visibleCols.user_type },
      { name: 'Role', field: 'role', visible: visibleCols.role },
      { name: 'Demo User', field: 'demo_user', visible: visibleCols.demo_user },
      { name: 'Action', field: 'action', visible: visibleCols.action },
    ],
    [visibleCols]
  )

  const tabs = useMemo(
    () => [
      { name: 'User Management', to: '/user', active: true },
      { name: 'Role', to: '/role' },
    ],
    []
  )

  const totalPages = useMemo(() => {
    return Math.ceil((usersData?.recordsFiltered || 0) / pageSize)
  }, [usersData, pageSize])

  return (
    <>
      <ListPageLayout
        title="User Management"
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
        createPermission="create_user"
        // AG Grid Props
        rowData={usersData?.data || []}
        columnDefs={columnDefs}
        // Pagination
        recordsTotal={usersData?.recordsFiltered || 0}
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
        // Extra Filters row
        toolbarExtra={
          <div className="flex items-center gap-2">
            <select
              value={userTypeFilter}
              onChange={(e) => {
                setUserTypeFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="bg-[#f8fafc] border border-gray-100 px-3 py-1.5 rounded-full text-[11px] font-semibold text-gray-500 hover:border-gray-300 focus:ring-1 focus:ring-primary/20 transition-all outline-none"
            >
              <option value="">User Type</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        }
        gridOptions={{
          rowHeight: 46, // slightly taller to comfortably fit avatars and switches
          suppressRowTransform: true,
        }}
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText="Yes, delete it"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </>
  )
}
