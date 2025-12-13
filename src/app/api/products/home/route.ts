// src/app/api/products/home/route.ts
import { NextResponse } from "next/server";
import { fetchAllProducts } from "../../../../controllers/productController";

export async function GET() {
  // пока жёстко 'ru', позже можно брать из куки/хедера
  const products = await fetchAllProducts("ru");
  return NextResponse.json(products);
}