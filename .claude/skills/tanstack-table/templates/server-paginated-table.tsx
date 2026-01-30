/**
 * Server-Side Paginated Table
 *
 * Complete example of TanStack Table + TanStack Query for server-side pagination.
 * Use for: Large datasets (1000+ rows), data from API
 */

import { useQuery } from '@tanstack/react-query'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'

interface User {
  created_at: string
  email: string
  id: string
  name: string
}

interface UsersResponse {
  data: Array<User>
  pagination: {
    page: number
    pageCount: number
    pageSize: number
    total: number
  }
}

const columns: Array<ColumnDef<User>> = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 80,
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'created_at',
    cell: info => new Date(info.getValue() as string).toLocaleDateString(),
    header: 'Created',
  },
]

export function ServerPaginatedTable() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  // TanStack Query: Fetch data from API
  // CRITICAL: Include ALL table state in query key for proper refetching
  const { data, error, isError, isLoading } = useQuery<UsersResponse>({
    // Keep previous data while fetching new page
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const response = await fetch(
        `/api/users?page=${pagination.pageIndex}&pageSize=${pagination.pageSize}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      return response.json()
    },
    queryKey: ['users', pagination.pageIndex, pagination.pageSize],
  })

  // TanStack Table: Manage display and interactions
  const table = useReactTable({
    columns,
    data: data?.data ?? [],
    getCoreRowModel: getCoreRowModel(),
    // CRITICAL: Tell table that pagination is handled by server
    manualPagination: true,
    onPaginationChange: setPagination,
    pageCount: data?.pagination.pageCount ?? 0,
    state: {
      pagination,
    },
  })

  if (isLoading) {
    return (
      <div className={"p-4"}>
        <div className={"animate-pulse"}>
          <div className={"mb-4 h-8 rounded-sm bg-gray-200"}></div>
          <div className={"space-y-3"}>
            {[...Array(5)].map((_, i) => (
              <div className={"h-12 rounded-sm bg-gray-200"} key={i}></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className={"p-4"}>
        <div className={"rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-red-700"}>
          Error: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className={"p-4"}>
      <h2 className={"mb-4 text-2xl font-bold"}>Users (Server-Side Pagination)</h2>

      <div className={"overflow-x-auto"}>
        <table className={"w-full border-collapse border border-gray-300"}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr className={"bg-gray-100"} key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    className={"border border-gray-300 px-4 py-2 text-left font-semibold"}
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr className={"hover:bg-gray-50"} key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td className={"border border-gray-300 px-4 py-2"} key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className={"mt-4 flex items-center justify-between"}>
        <div className={"flex items-center gap-2"}>
          <button
            className={"rounded-sm border px-3 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"}
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.firstPage()}
          >
            {'<<'}
          </button>
          <button
            className={"rounded-sm border px-3 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"}
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            {'<'}
          </button>
          <button
            className={"rounded-sm border px-3 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"}
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            {'>'}
          </button>
          <button
            className={"rounded-sm border px-3 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"}
            disabled={!table.getCanNextPage()}
            onClick={() => table.lastPage()}
          >
            {'>>'}
          </button>
        </div>

        <div className={"flex items-center gap-4 text-sm"}>
          <span>
            Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of{' '}
            <strong>{table.getPageCount()}</strong>
          </span>

          <span>
            Total: <strong>{data?.pagination.total ?? 0}</strong> users
          </span>

          <select
            className={"rounded-sm border px-2 py-1"}
            onChange={e => {
              table.setPageSize(Number(e.target.value))
            }}
            value={table.getState().pagination.pageSize}
          >
            {[10, 20, 30, 40, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
