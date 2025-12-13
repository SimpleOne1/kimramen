// src/controllers/productController.ts
import { getAllProducts,Product } from "../models/product";


export async function fetchAllProducts(locale: "ru" | "en" = "ru"): Promise<Product[]> {
  return await getAllProducts(locale);
}