export type PosfixJsonValue =
  | string
  | number
  | boolean
  | null
  | PosfixJsonValue[]
  | { [key: string]: PosfixJsonValue };

export interface PosfixAttribute {
  code: string;
  value: string | number | boolean | null;
}

export interface PosfixStock {
  warehouseId: string | null;
  quantity: number | string | null;
}

export interface PosfixProduct {
  posfixId: string;
  code: string;
  name: string;
  description: string | null;
  barcode: string | null;
  price: number | string | null;
  currency: string | null;
  vatRate: number | string | null;
  unit: string | null;
  isActive: boolean;
  category: string | { id?: string; code?: string; name?: string } | null;
  imageUrl: string | null;
  attributes: PosfixAttribute[];
  composition: PosfixJsonValue[];
  onHand: PosfixStock[];
  descriptions: Record<string, string>;
  contentBlocks: PosfixJsonValue[];
  categoryPath: PosfixJsonValue[];
  sku: string | null;
  shelfLifeDays: number | string | null;
  packaging: PosfixJsonValue[];
  inStock: boolean;
}

export interface PosfixProductsResponse {
  items: PosfixProduct[];
  nextCursor: string | null;
}

export interface PosfixCategory {
  id?: string;
  code?: string;
  name?: string;
  description?: string | null;
  parentId?: string | null;
  sortOrder?: number | string | null;
  isActive?: boolean;
  children?: PosfixCategory[];
}

export interface PosfixCategoriesResponse {
  items: PosfixCategory[];
}

export interface PosfixAttributeDefinition {
  code: string;
  name: string;
  dataType: string;
  values: string[];
  sortOrder: number | string | null;
}

export interface PosfixAttributesResponse {
  items: PosfixAttributeDefinition[];
}

export interface PosfixCatalog {
  products: PosfixProduct[];
  categories: PosfixCategory[];
  attributes: PosfixAttributeDefinition[];
}
