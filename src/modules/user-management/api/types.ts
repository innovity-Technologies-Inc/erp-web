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
