/**
 * Basic Client-Side Table
 *
 * Simple TanStack Table example with local data.
 * Use for: Small datasets (<1000 rows), all data available client-side
 */

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo } from 'react'

interface User {
  email: string
  id: string
  name: string
  role: string
}

// Define columns outside component OR use useMemo to prevent infinite re-renders
const columns: Array<ColumnDef<User>> = [
  {
    accessorKey: 'id',
    header: 'ID',
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
    accessorKey: 'role',
    header: 'Role',
  },
]

export function BasicClientTable() {
  // CRITICAL: Memoize data to prevent infinite re-renders
  const data = useMemo<Array<User>>(
    () => [
      { email: 'alice@example.com', id: '1', name: 'Alice Smith', role: 'Admin' },
      { email: 'bob@example.com', id: '2', name: 'Bob Johnson', role: 'User' },
      { email: 'charlie@example.com', id: '3', name: 'Charlie Brown', role: 'User' },
      { email: 'diana@example.com', id: '4', name: 'Diana Prince', role: 'Editor' },
    ],
    []
  )

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(), // Required: Core functionality
  })

  return (
    <div className={"p-4"}>
      <h2 className={"mb-4 text-2xl font-bold"}>Users</h2>

      <table className={"w-full border-collapse border border-gray-300"}>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr className={"bg-gray-100"} key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  className={"border border-gray-300 px-4 py-2 text-left"}
                  key={header.id}
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
                <td
                  className={"border border-gray-300 px-4 py-2"}
                  key={cell.id}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className={"mt-4 text-sm text-gray-600"}>
        Showing {table.getRowModel().rows.length} rows
      </div>
    </div>
  )
}
