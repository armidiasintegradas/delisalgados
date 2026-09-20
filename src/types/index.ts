export type PriceType = 'simple' | 'variants';
export type Availability = 'available' | 'unavailable' | 'on_request';
export type PreparationType = 'fried' | 'baked' | 'frozen' | 'ready' | 'variants';
export type FulfillmentType = 'pickup' | 'delivery' | 'to_agree';
export type OrderStatus = 'generated' | 'contacted' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentPlan = 'deposit_50' | 'full';
export type PaymentStatus = 'pending' | 'partially_paid' | 'paid' | 'failed' | 'refunded';
export type DeliveryProvider = 'uber' | '99' | 'indrive' | 'customer_choice';
export type DeliveryQuoteStatus = 'available' | 'external' | 'unavailable' | 'error';

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  unit_label: string;
  minimum_quantity: number;
  sort_order: number;
  is_active: boolean;
  preparation_type?: Exclude<PreparationType, 'variants'> | null;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  note: string | null;
  unit_label: string;
  minimum_quantity: number;
  price_type: PriceType;
  base_price: number | null;
  availability: Availability;
  is_visible: boolean;
  is_featured: boolean;
  is_promotion?: boolean;
  sales_count?: number;
  sort_order: number;
  image_url: string | null;
  images?: ProductImage[];
  preparation_type?: PreparationType | null;
  created_at?: string;
  updated_at?: string;
  variants?: ProductVariant[];
  category?: Category;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name_snapshot: string;
  variant_name_snapshot: string | null;
  unit_label_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  subtotal: number;
  note: string | null;
  created_at?: string;
}

export interface Order {
  id: string;
  public_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  customer_user_id?: string | null;
  desired_date: string;
  fulfillment_type: FulfillmentType;
  delivery_address: string | null;
  customer_reference_point?: string | null;
  customer_note: string | null;
  total: number;
  status: OrderStatus;
  whatsapp_status: string;
  payment_plan?: PaymentPlan;
  payment_method?: 'pix';
  payment_status?: PaymentStatus;
  deposit_percentage?: number;
  amount_due_now?: number;
  amount_paid?: number;
  balance_due?: number;
  payment_provider?: string | null;
  payment_reference?: string | null;
  payment_confirmed_at?: string | null;
  payment_reported_at?: string | null;
  payment_reported_amount?: number | null;
  delivery_provider?: DeliveryProvider | null;
  delivery_quote_amount?: number | null;
  delivery_quote_currency?: string | null;
  delivery_quote_id?: string | null;
  delivery_quote_expires_at?: string | null;
  delivery_eta_minutes?: number | null;
  handoff_token_hash?: string | null;
  handoff_token_expires_at?: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface Settings {
  business_name: string;
  whatsapp_number: string;
  instagram_url: string;
  address: string;
  pickup_information: string;
  delivery_information: string;
  whatsapp_opening_message: string;
  whatsapp_closing_message: string;
  catalog_show_search: boolean;
  catalog_show_prices: boolean;
  catalog_show_unavailable: boolean;
  special_order_cta_enabled: boolean;
  special_order_cta_text: string;
  logo_url: string | null;
  pattern_url: string | null;
  pix_key: string;
  pix_receiver_name: string;
  pix_receiver_city: string;
}

export interface CartItem {
  id: string; // unique item key in cart (e.g. productId or productId:variantId)
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  unitPrice: number;
  unitLabel: string;
  minimumQuantity: number;
  quantity: number;
  subtotal: number;
  note?: string;
}

export interface CustomerData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  desiredDate: string;
  fulfillmentType: FulfillmentType;
  deliveryAddress: string;
  postalCode?: string;
  street?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  referencePoint: string;
  customerNote?: string;
}


export interface CustomerProfile {
  id: string;
  email: string;
  full_name: string;
  whatsapp: string;
  address: string;
  postal_code?: string | null;
  street?: string | null;
  address_number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  reference_point: string;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}


export interface DeliveryQuoteOption {
  provider: DeliveryProvider;
  provider_label: string;
  status: DeliveryQuoteStatus;
  price: number | null;
  currency: string;
  eta_minutes: number | null;
  quote_id: string | null;
  expires_at: string | null;
  action_url?: string | null;
  note?: string | null;
}
