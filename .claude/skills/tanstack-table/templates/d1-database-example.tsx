/**
 * Cloudflare D1 Database Integration Example
 *
 * Complete example of TanStack Table with Cloudflare Workers + D1 backend.
 * Includes: Server-side pagination, filtering, sorting with SQL queries.
 */

// ============================================
// CLOUDFLARE WORKERS API (functions/api/users.ts)
// ============================================

interface Env {
  DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url)

  // Parse query parameters
  const page = Number(url.searchParams.get('page')) || 0
  const pageSize = Number(url.searchParams.get('pageSize')) || 20
  const sortBy = url.searchParams.get('sortBy') || 'created_at'
  const sortOrder = url.searchParams.get('sortOrder') || 'desc'
  const search = url.searchParams.get('search') || ''

  const offset = page * pageSize

  try {
    // Build SQL query with filters
    let query = `
      SELECT id, name, email, role, created_at
      FROM users
    `
    const params: Array<number | string> = []

    // Add search filter
    if (search) {
      query += ` WHERE name LIKE ? OR email LIKE ?`
      params.push(`%${search}%`, `%${search}%`)
    }

    // Add sorting (validate to prevent SQL injection)
    const allowedSortColumns = ['id', 'name', 'email', 'role', 'created_at']
    const allowedSortOrders = ['asc', 'desc']
    if (allowedSortColumns.includes(sortBy) && allowedSortOrders.includes(sortOrder)) {
      query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`
    } else {
      query += ` ORDER BY created_at DESC`
    }

    // Add pagination
    query += ` LIMIT ? OFFSET ?`
    params.push(pageSize, offset)

    // Execute query
    const { results } = await env.DB.prepare(query).bind(...params).all()

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM users`
    const countParams: Array<string> = []
    if (search) {
      countQuery += ` WHERE name LIKE ? OR email LIKE ?`
      countParams.push(`%${search}%`, `%${search}%`)
    }
    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>()
    const total = countResult?.total || 0

    return Response.json({
      data: results,
      pagination: {
        page,
        pageCount: Math.ceil(total / pageSize),
        pageSize,
        total,
      },
    })
  } catch (error) {
    console.error('Database error:', error)
    return Response.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// ============================================
// CLIENT-SIDE TABLE COMPONENT
// ============================================

import { useQuery } from '@tanstack/react-query'
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'

interface User {
  created_at: string
  email: string
  id: string
  name: string
  role: string
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
    enableSorting: true,
    header: 'ID',
  },
  {
    accessorKey: 'name',
    enableSorting: true,
    header: 'Name',
  },
  {
    accessorKey: 'email',
    enableSorting: true,
    header: 'Email',
  },
  {
    accessorKey: 'role',
    enableSorting: true,
    header: 'Role',
  },
  {
    accessorKey: 'created_at',
    cell: info => new Date(info.getValue() as string).toLocaleDateString(),
    enableSorting: true,
    header: 'Created',
  },
]

export function D1DatabaseTable() {
  // Table state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Extract search from column filters
  const searchValue = columnFilters.find(f => f.id === 'search')?.value as string || ''

  // CRITICAL: Include ALL state in query key
  const { data, isError, isLoading } = useQuery<UsersResponse>({
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.pageIndex.toString(),
        pageSize: pagination.pageSize.toString(),
      })

      // Add sorting params
      if (sorting.length > 0) {
        params.append('sortBy', sorting[0].id)
        params.append('sortOrder', sorting[0].desc ? 'desc' : 'asc')
      }

      // Add search param
      if (searchValue) {
        params.append('search', searchValue)
      }

      const response = await fetch(`/api/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
    queryKey: ['users', pagination, sorting, searchValue],
  })

  const table = useReactTable({
    columns,
    data: data?.data ?? [],
    getCoreRowModel: getCoreRowModel(),
    manualFiltering: true,
    // Server-side features
    manualPagination: true,
    manualSorting: true,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    pageCount: data?.pagination.pageCount ?? 0,
    state: {
      columnFilters,
      pagination,
      sorting,
    },
  })

  return (
    <div className={"p-4"}>
      <h2 className={"mb-4 text-2xl font-bold"}>Users (D1 Database)</h2>

      {/* Search Filter */}
      <div className={"mb-4"}>
        <input
          className={"w-full max-w-md rounded-sm border px-3 py-2"}
          onChange={e =>
            setColumnFilters([{ id: 'search', value: e.target.value }])
          }
          placeholder={"Search by name or email..."}
          type={"text"}
          value={searchValue}
        />
      </div>

      {isLoading && <div>Loading...</div>}
      {isError && <div className={"text-red-600"}>Error loading data</div>}

      {!isLoading && !isError && (
        <>
          <table className={"w-full border-collapse"}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      className={"cursor-pointer border bg-gray-100 px-4 py-2 hover:bg-gray-200"}
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className={"flex items-center gap-2"}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td className={"border px-4 py-2"} key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className={"mt-4 flex justify-between"}>
            <div>
              Page {pagination.pageIndex + 1} of {data?.pagination.pageCount ?? 0}
            </div>
            <div className={"flex gap-2"}>
              <button
                className={"rounded-sm border px-3 py-1 disabled:opacity-50"}
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                Previous
              </button>
              <button
                className={"rounded-sm border px-3 py-1 disabled:opacity-50"}
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// WRANGLER.JSONC CONFIGURATION
// ============================================

/*
{
  "name": "tanstack-table-d1-example",
  "compatibility_date": "2025-11-07",
  "pages_build_output_dir": "dist",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "users-db",
      "database_id": "your-database-id"
    }
  ]
}
*/

// ============================================
// DATABASE SCHEMA (schema.sql)
// ============================================

/*
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Seed data
INSERT INTO users (id, name, email, role) VALUES
  ('1', 'Alice Smith', 'alice@example.com', 'admin'),
  ('2', 'Bob Johnson', 'bob@example.com', 'user'),
  ('3', 'Charlie Brown', 'charlie@example.com', 'editor');
*/
