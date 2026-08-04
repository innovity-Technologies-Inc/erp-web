export interface Designation {
  id: number
  uuid: string
  designation: string
  details: string | null
  status: number // 1 for active, 0 for inactive
  created_at?: string
  updated_at?: string
}

export interface DesignationFilters {
  draw?: number
  start?: number
  length?: number
  search?: { value: string }
  status?: string
  start_date?: string
  end_date?: string
}

export interface CreateDesignationDto {
  designation: string
  details?: string | null
  status?: number
}

export interface UpdateDesignationDto {
  id: number
  designation: string
  details?: string | null
  status?: number
}
