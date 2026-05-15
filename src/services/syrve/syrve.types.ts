export interface SyrveGroup {
  id: string;
  parentGroup: string | null;
  order: number;
  isIncludedInMenu: boolean;
  isGroupModifier: boolean;
  code: string;
  name: string;
  description: string | null;
  additionalInfo: string | null;
  tags: string[];
  isDeleted: boolean;
  seoDescription: string | null;
  seoText: string | null;
  seoKeywords: string | null;
  seoTitle: string | null;
  imageLinks?: string[];
}

export interface SyrveProductPrice {
  currentPrice?: number | string | null;
}

export interface SyrveProductSizePrice {
  price?: SyrveProductPrice | null;
}

export interface SyrveProduct {
  id: string;
  code: string;
  name: string;
  type: string;
  parentGroup: string | null;
  productCategoryId: string | null;
  measureUnit: string | null;
  weight: number | null;
  description?: string | null;
  additionalInfo?: string | null;
  seoDescription?: string | null;
  seoText?: string | null;
  seoKeywords?: string | null;
  seoTitle?: string | null;
  fatAmount?: number | null;
  proteinsAmount?: number | null;
  carbohydratesAmount?: number | null;
  energyAmount?: number | null;
  fatFullAmount?: number | null;
  proteinsFullAmount?: number | null;
  carbohydratesFullAmount?: number | null;
  energyFullAmount?: number | null;
  imageLinks?: string[];
  isDeleted?: boolean;
  sizePrices?: SyrveProductSizePrice[] | null;
}

export interface SyrveNomenclatureResponse {
  correlationId?: string;
  groups: SyrveGroup[];
  products: SyrveProduct[];
}