import { NextRequest, NextResponse } from "next/server";
import { getCatalogProducts, type CatalogSort } from "@/src/lib/catalog-products";
import { isLocale, type Locale } from "@/src/lib/i18n/locale";

type Params = { params: Promise<{ id: string }> };

function readList(searchParams: URLSearchParams, key: string) {
  return searchParams.getAll(key).flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
}

function readIds(searchParams: URLSearchParams, key: string) {
  return readList(searchParams, key).map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0);
}

function readNumber(searchParams: URLSearchParams, key: string) {
  const raw = searchParams.get(key);
  if (raw === null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const categoryId = Number(id);

    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      return NextResponse.json({ success: false, products: [], message: "Некорректная категория" }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const requestedLocale = searchParams.get("locale");
    const locale: Locale = isLocale(requestedLocale) ? requestedLocale : "ru";
    const result = await getCatalogProducts({
      categoryId,
      q: searchParams.get("q"),
      page: Number(searchParams.get("page") || 1),
      limit: Number(searchParams.get("limit") || 16),
      minPrice: readNumber(searchParams, "minPrice"),
      maxPrice: readNumber(searchParams, "maxPrice"),
      brands: readList(searchParams, "brand"),
      countries: readList(searchParams, "country"),
      categories: readIds(searchParams, "category"),
      sort: (searchParams.get("sort") || "date_desc") as CatalogSort,
      locale,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/catalog/categories/[id]/products error:", error);
    return NextResponse.json(
      { success: false, products: [], pagination: { page: 1, limit: 16, total: 0, totalPages: 1 }, filters: null, message: "Не удалось загрузить товары категории" },
      { status: 500 },
    );
  }
}
