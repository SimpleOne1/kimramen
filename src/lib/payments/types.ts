export type PaymentProvider = "maib" | "paynet";

export type PaymentCreateInput = {
  orderId: number;
  provider: PaymentProvider;
  language?: "ru" | "ro" | "en";
  customerIp?: string | null;
  userAgent?: string | null;
  publicBaseUrl?: string | null;
};

export type PaymentCreateResult = {
  success: boolean;
  message?: string;
  orderNumber?: string;
  redirectUrl?: string;
  transactionId?: number;
  provider?: PaymentProvider;
  checkoutId?: string | null;
};

export type PaymentProviderOrder = {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  totalAmount: number;
  subtotalAmount: number;
  deliveryAmount: number;
  currency: string;
  items: Array<{
    productId: number | null;
    sku: string | null;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    currency: string;
  }>;
};
