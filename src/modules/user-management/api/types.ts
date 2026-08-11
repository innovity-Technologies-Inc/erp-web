export interface Role {
  id: number
  name: string
  permissions: string // Contains pre-rendered HTML badges from the backend
  permissions_grouped?: Record<string, string[]>
}

export interface PermissionItem {
  id: number
  name: string
}

export interface GroupedPermissions {
  [moduleName: string]: {
    [groupName: string]: PermissionItem[]
  }
}

export interface PermissionsListResponse {
  grouped_permissions: GroupedPermissions
  organizations?: Array<{ id: number; name: string }>
  companies?: Array<{ id: number; company_name: string; organization_id: number }>
}

export interface RoleFilters {
  start: number
  length: number
  draw: number
  'search[value]'?: string
}

export interface RoleDTO {
  name: string
  permissions: number[]
  organization_id?: number
  company_id?: number
}

// ─── User Types ───────────────────────────────────────────────────────────────

export interface UserListItem {
  id: number
  name: string
  email: string
  mobile: string
  role: string
  role_name: string
  user_type: string
  is_demo_user: number
  demo_user_status: string
  image?: string // Path to profile image
}

export interface UserFilters {
  start: number
  length: number
  draw: number
  'search[value]'?: string
  user_type?: string
  role_id?: string
  status?: string
}

export interface UserDetailData {
  id: number
  first_name: string
  last_name: string
  email: string
  mobile: string
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  user_type: string
  is_demo_user: number
  organization_id: number | null
  company_id: number | null
  image: string | null
  roles: Array<{ id: number; name: string }>
}
