export type ApiResponse<T> = {
  data: T
  success: boolean
  message?: string
  timestamp: string
}

export type PaginatedResponse<T> = ApiResponse<{
  items: T[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}>

export type PaginationParams = {
  page: number
  pageSize: number
}

export type SortParams = {
  sortBy: string
  sortOrder: "asc" | "desc"
}

export type FilterParams = Record<string, string | string[] | number | boolean | null | undefined>

export type ListQueryParams = PaginationParams & SortParams & FilterParams

export type ApiError = {
  code: string
  message: string
  details?: Record<string, string[]>
  status: number
}
