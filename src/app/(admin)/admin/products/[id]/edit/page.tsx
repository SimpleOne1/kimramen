import { cookies } from "next/headers";
import AdminProductEditor from "@/src/components/admin/products/AdminProductEditor";

type PageProps = { params: Promise<{ id: string }> };

async function getProduct(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const cookieHeader = (await cookies()).toString();
  const response = await fetch(`${baseUrl}/api/admin/products/${id}`, {
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
  if (!response.ok) throw new Error("Не удалось загрузить товар");
  const data = await response.json();
  if (!data.success) throw new Error(data.message || "Не удалось загрузить товар");
  return data.product;
}

async function getCategories() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const cookieHeader = (await cookies()).toString();
  const response = await fetch(`${baseUrl}/api/admin/categories`, {
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.categories || [];
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getProduct(id), getCategories()]);
  return <AdminProductEditor product={product} categories={categories} />;
}
