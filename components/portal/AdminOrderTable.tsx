"use client"

import Link from "next/link"
import { DataTable, type Column } from "@/components/app/DataTable"
import type { Order } from "@/lib/store"
import { currency, shortDate } from "@/lib/utils"

const columns: Column<Order>[] = [
  {
    key: "number",
    header: "Order",
    sortValue: (order) => order.number,
    render: (order) => (
      <Link
        href={`/portal/orders/${order.id}`}
        className="font-mono text-xs font-medium text-[var(--brand)] hover:underline"
      >
        {order.number}
      </Link>
    ),
  },
  {
    key: "customer",
    header: "Customer",
    sortValue: (order) => order.customerName,
    render: (order) => order.customerName,
  },
  {
    key: "item",
    header: "Item",
    sortValue: (order) => order.item.name,
    render: (order) => (
      <span className="block max-w-[16rem] truncate">{order.item.name}</span>
    ),
  },
  {
    key: "placed",
    header: "Placed",
    sortValue: (order) => order.placedOn,
    render: (order) => <span className="nums">{shortDate(order.placedOn)}</span>,
  },
  {
    key: "status",
    header: "Stage",
    sortValue: (order) => order.stageIndex,
    render: (order) => (
      <span
        className="whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium"
        style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
      >
        {order.status}
      </span>
    ),
  },
  {
    key: "total",
    header: "Total",
    align: "right",
    sortValue: (order) => order.totals.total,
    render: (order) => <span className="nums">{currency(order.totals.total)}</span>,
  },
]

export function AdminOrderTable({ orders }: { orders: Order[] }) {
  return (
    <DataTable
      columns={columns}
      rows={orders}
      getKey={(order) => order.id}
      searchPlaceholder="Filter by customer, order number, or item…"
      initialSort={{ key: "placed", direction: "desc" }}
    />
  )
}
