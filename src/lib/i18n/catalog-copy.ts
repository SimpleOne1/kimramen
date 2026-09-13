import type { Locale } from "./locale";

export type CatalogCopy = {
  catalog: string;
  home: string;
  filters: string;
  price: string;
  applyPrice: string;
  category: string;
  brand: string;
  brandSearch: string;
  country: string;
  countrySearch: string;
  reset: string;
  nothingFound: string;
  clearFilter: string;
  previous: string;
  next: string;
  searchProduct: string;
  searchButton: string;
  searchTitle: string;
  searchEmpty: string;
  productFallback: string;
  descriptionSoon: string;
  nutritionTitle: string;
  nutritionPer100: string;
  nutritionUnavailable: string;
  details: string;
  description: string;
  composition: string;
  storage: string;
  deliveryPayment: string;
  related: string;
  inStock: string;
  outOfStock: string;
  priceLabel: string;
  countryLabel: string;
  brandLabel: string;
  weightLabel: string;
  barcodeLabel: string;
  shelfLifeLabel: string;
  vatLabel: string;
  articleLabel: string;
  pieces: string;
  grams: string;
  allergens: string;
  glutenFree: string;
  vegan: string;
  organic: string;
  sourceCompositionUnavailable: string;
  storageText: string;
  deliveryText: string;
};

const COPY: Record<Locale, CatalogCopy> = {
  ru: {
    catalog: "Каталог товаров", home: "Главная", filters: "Фильтры", price: "Цена", applyPrice: "Применить цену",
    category: "Категория", brand: "Торговая марка", brandSearch: "Поиск по торговой марке", country: "Страна",
    countrySearch: "Поиск по стране производства", reset: "Сбросить", nothingFound: "Ничего не найдено",
    clearFilter: "Очистить фильтр", previous: "Назад", next: "Вперёд", searchProduct: "Найти товар", searchButton: "Найти",
    searchTitle: "Поиск товаров", searchEmpty: "Введите название товара в поиске.", productFallback: "Товар Kimramen",
    descriptionSoon: "Описание скоро появится.", nutritionTitle: "Пищевая ценность:", nutritionPer100: "Пищевая ценность на 100 г:",
    nutritionUnavailable: "Данные по БЖУ и калорийности пока не переданы POSfix для этого товара.", details: "Детали:", description: "Описание:",
    composition: "Состав", storage: "Условия хранения", deliveryPayment: "Доставка и оплата", related: "Похожие товары",
    inStock: "В наличии", outOfStock: "Нет в наличии", priceLabel: "Цена", countryLabel: "Страна", brandLabel: "Торговая марка",
    weightLabel: "Вес / объём", barcodeLabel: "Штрихкод", shelfLifeLabel: "Срок годности", vatLabel: "НДС", articleLabel: "Арт.",
    pieces: "шт.", grams: "г", allergens: "Содержит аллергены", glutenFree: "Без глютена", vegan: "Веган", organic: "Органический",
    sourceCompositionUnavailable: "Состав не передан POSfix для этого товара. Подробная информация, если она есть в источнике, доступна в описании.",
    storageText: "Храните товар в сухом прохладном месте, соблюдая условия и срок годности, указанные на упаковке.",
    deliveryText: "Доставка и оплата будут подключены к постоянному информационному блоку сайта.",
  },
  en: {
    catalog: "Product catalog", home: "Home", filters: "Filters", price: "Price", applyPrice: "Apply price",
    category: "Category", brand: "Brand", brandSearch: "Search by brand", country: "Country", countrySearch: "Search by country",
    reset: "Reset", nothingFound: "Nothing found", clearFilter: "Clear filter", previous: "Back", next: "Next",
    searchProduct: "Find a product", searchButton: "Search", searchTitle: "Product search", searchEmpty: "Enter a product name to search.",
    productFallback: "Kimramen product", descriptionSoon: "Description coming soon.", nutritionTitle: "Nutritional value:",
    nutritionPer100: "Nutritional value per 100 g:", nutritionUnavailable: "POSfix did not provide nutrition data for this product.",
    details: "Details:", description: "Description:", composition: "Ingredients", storage: "Storage conditions", deliveryPayment: "Delivery and payment",
    related: "Related products", inStock: "In stock", outOfStock: "Out of stock", priceLabel: "Price", countryLabel: "Country",
    brandLabel: "Brand", weightLabel: "Weight / volume", barcodeLabel: "Barcode", shelfLifeLabel: "Shelf life", vatLabel: "VAT",
    articleLabel: "Art.", pieces: "pcs.", grams: "g", allergens: "Contains allergens", glutenFree: "Gluten-free", vegan: "Vegan", organic: "Organic",
    sourceCompositionUnavailable: "POSfix did not provide ingredients for this product. Any available source details are shown in the description.",
    storageText: "Store the product in a cool, dry place and follow the storage conditions and expiry date on the package.",
    deliveryText: "Delivery and payment details will be connected to the site's permanent information block.",
  },
  ro: {
    catalog: "Catalog de produse", home: "Acasă", filters: "Filtre", price: "Preț", applyPrice: "Aplică prețul",
    category: "Categorie", brand: "Brand", brandSearch: "Caută după brand", country: "Țară", countrySearch: "Caută după țara de origine",
    reset: "Resetează", nothingFound: "Nu a fost găsit nimic", clearFilter: "Șterge filtrul", previous: "Înapoi", next: "Înainte",
    searchProduct: "Găsește produsul", searchButton: "Caută", searchTitle: "Căutare produse", searchEmpty: "Introdu numele produsului pentru căutare.",
    productFallback: "Produs Kimramen", descriptionSoon: "Descrierea va apărea în curând.", nutritionTitle: "Valoare nutritivă:",
    nutritionPer100: "Valoare nutritivă per 100 g:", nutritionUnavailable: "POSfix nu a transmis date nutriționale pentru acest produs.",
    details: "Detalii:", description: "Descriere:", composition: "Ingrediente", storage: "Condiții de păstrare", deliveryPayment: "Livrare și plată",
    related: "Produse similare", inStock: "În stoc", outOfStock: "Stoc epuizat", priceLabel: "Preț", countryLabel: "Țară",
    brandLabel: "Brand", weightLabel: "Greutate / volum", barcodeLabel: "Cod de bare", shelfLifeLabel: "Termen de valabilitate", vatLabel: "TVA",
    articleLabel: "Art.", pieces: "buc.", grams: "g", allergens: "Conține alergeni", glutenFree: "Fără gluten", vegan: "Vegan", organic: "Organic",
    sourceCompositionUnavailable: "POSfix nu a transmis ingredientele pentru acest produs. Detaliile disponibile din sursă sunt prezentate în descriere.",
    storageText: "Păstrează produsul într-un loc răcoros și uscat, respectând condițiile de păstrare și termenul de valabilitate de pe ambalaj.",
    deliveryText: "Detaliile despre livrare și plată vor fi conectate la blocul permanent de informații al site-ului.",
  },
};

export function getCatalogCopy(locale: Locale = "ru") {
  return COPY[locale] || COPY.ru;
}
