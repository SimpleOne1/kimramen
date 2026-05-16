import { ensureAuthSchema } from "@/src/lib/auth/schema";
import { getAdminOrders } from "@/src/lib/admin/orders";
import { CACHE_TAGS, getCached } from "@/src/lib/cache";
import { safeQuery } from "@/src/lib/db-safe";
import { logAppError } from "@/src/lib/logger";

type DashboardStatsRow = {
  products_count: number | string | null;
  active_products_count: number | string | null;
  categories_count: number | string | null;
  customers_count: number | string | null;
  admins_count: number | string | null;
  orders_count: number | string | null;
  today_orders_count: number | string | null;
  processing_orders_count: number | string | null;
  new_orders_count: number | string | null;
  today_revenue: number | string | null;
  total_revenue: number | string | null;
};

type StatusRow = { status: string; count: number | string };

function toNumber(value: number | string | null | undefined) {
  return Number(value || 0);
}

async function loadDashboardData() {
  await ensureAuthSchema();

  try {
    const [statsRows, statusRows, recentOrders] = await Promise.all([
      safeQuery<DashboardStatsRow[]>(
        `
        SELECT
          (SELECT COUNT(*) FROM products) AS products_count,
          (SELECT COUNT(*) FROM products WHERE is_active = 1) AS active_products_count,
          (SELECT COUNT(*) FROM categories) AS categories_count,
          (SELECT COUNT(*) FROM customers) AS customers_count,
          (SELECT COUNT(*) FROM admin_users WHERE is_active = 1) AS admins_count,
          (SELECT COUNT(*) FROM orders) AS orders_count,
          (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()) AS today_orders_count,
          (SELECT COUNT(*) FROM orders WHERE status = 'processing') AS processing_orders_count,
          (SELECT COUNT(*) FROM orders WHERE status = 'new') AS new_orders_count,
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status <> 'cancelled' AND DATE(created_at) = CURDATE()) AS today_revenue,
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status <> 'cancelled') AS total_revenue
        `,
        [],
        { label: "admin.dashboard.stats" }
      ),
      safeQuery<StatusRow[]>(
        `
        SELECT status, COUNT(*) AS count
        FROM orders
        GROUP BY status
        `,
        [],
        { label: "admin.dashboard.statusCounts" }
      ),
      getAdminOrders({ limit: 6 }),
    ]);

    const stats = statsRows[0] || ({} as DashboardStatsRow);
    const statusCounts = statusRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = toNumber(row.count);
      return acc;
    }, {});

    return {
      stats: {
        productsCount: toNumber(stats.products_count),
        activeProductsCount: toNumber(stats.active_products_count),
        categoriesCount: toNumber(stats.categories_count),
        customersCount: toNumber(stats.customers_count),
        adminsCount: toNumber(stats.admins_count),
        ordersCount: toNumber(stats.orders_count),
        todayOrdersCount: toNumber(stats.today_orders_count),
        processingOrdersCount: toNumber(stats.processing_orders_count),
        newOrdersCount: toNumber(stats.new_orders_count),
        todayRevenue: toNumber(stats.today_revenue),
        totalRevenue: toNumber(stats.total_revenue),
      },
      statusCounts: {
        new: statusCounts.new || 0,
        processing: statusCounts.processing || 0,
        completed: statusCounts.completed || 0,
        cancelled: statusCounts.cancelled || 0,
      },
      recentOrders,
    };
  } catch (error) {
    await logAppError("admin.dashboard.load", error);
    throw error;
  }
}

export async function getAdminDashboardData() {
  return getCached("admin:dashboard", loadDashboardData, {
    ttlMs: 15_000,
    tags: [CACHE_TAGS.adminDashboard],
  });
}
