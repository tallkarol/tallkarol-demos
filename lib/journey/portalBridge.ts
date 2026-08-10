import { ordersForCustomer, findOrder, type Order } from "@/lib/store"
import type { DemoUser } from "@/lib/auth"
import { getRun, advanceIfDue } from "@/lib/journey/runs"

/**
 * Where the two worlds meet: seeded customers read the frozen JSON dataset,
 * journey customers read their own live run. The portal pages call these two
 * functions and never know which world they're rendering — the run's
 * order_json is the same Order shape the seeded data uses.
 *
 * Reading a journey order advances its clock (advanceIfDue), so the portal
 * timeline moves even if the visitor never kept the live journey page open.
 */
export async function portalOrders(user: DemoUser): Promise<Order[]> {
  const customerId = user.customerId ?? ""
  if (customerId.startsWith("jr:")) {
    try {
      const run = await getRun(customerId.slice(3))
      if (!run) return []
      const fresh = await advanceIfDue(run)
      return [fresh.order_json]
    } catch {
      return []
    }
  }
  return ordersForCustomer(customerId)
}

export async function portalOrder(user: DemoUser, orderId: string): Promise<Order | null> {
  if ((user.customerId ?? "").startsWith("jr:")) {
    const orders = await portalOrders(user)
    return orders.find((order) => order.id === orderId) ?? null
  }
  return findOrder(orderId)
}
