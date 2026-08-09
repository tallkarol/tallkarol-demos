"use client"

import { DataTable, type Column } from "@/components/app/DataTable"
import type { StoreData } from "@/lib/store"

type Event = StoreData["auditLog"][number]

const columns: Column<Event>[] = [
  {
    key: "at",
    header: "When",
    sortValue: (event) => event.at,
    render: (event) => (
      <span className="nums whitespace-nowrap text-xs text-app-ink/70">
        {event.at.slice(0, 10)} {event.at.slice(11, 16)}
      </span>
    ),
  },
  {
    key: "actor",
    header: "Actor",
    sortValue: (event) => event.actor,
    render: (event) => event.actor,
  },
  {
    key: "action",
    header: "Action",
    sortValue: (event) => event.action,
    render: (event) => event.action,
  },
  {
    key: "subject",
    header: "Order",
    sortValue: (event) => event.subject,
    render: (event) => <span className="font-mono text-xs">{event.subject}</span>,
  },
  {
    key: "ip",
    header: "IP",
    align: "right",
    sortValue: (event) => event.ip,
    render: (event) => (
      <span className="font-mono text-xs text-app-ink/55">{event.ip}</span>
    ),
  },
]

export function ActivityTable({ events }: { events: Event[] }) {
  return (
    <DataTable
      columns={columns}
      rows={events}
      getKey={(event) => event.id}
      searchPlaceholder="Filter by actor, action, or order…"
      initialSort={{ key: "at", direction: "desc" }}
    />
  )
}
