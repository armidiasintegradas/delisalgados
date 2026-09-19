import { Category, Product, ProductVariant, Settings, Order, OrderItem, CustomerData, Availability } from "@/types";
import { isServerSupabaseConfigured, supabaseServer } from "@/lib/supabase/server";
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_VARIANTS, INITIAL_SETTINGS } from "./seedData";
import fs from "fs";
import path from "path";

// Local state file for standalone local development when Supabase credentials are not provided
const STATE_FILE_PATH = path.join(process.cwd(), ".local-db-state.json");

interface LocalDbState {
  categories: Category[];
  products: Product[];
  variants: ProductVariant[];
  settings: Settings;
  orders: Order[];
  auditLogs: any[];
}

function loadLocalState(): LocalDbState {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE_PATH, "utf-8"));
      return data;
    }
  } catch (err) {
    console.warn("[LocalDB] Error reading local state file, reverting to seed", err);
  }

  const initial: LocalDbState = {
    categories: [...INITIAL_CATEGORIES],
    products: [...INITIAL_PRODUCTS],
    variants: [...INITIAL_VARIANTS],
    settings: { ...INITIAL_SETTINGS },
    orders: [],
    auditLogs: [],
  };
  saveLocalState(initial);
  return initial;
}

function saveLocalState(state: LocalDbState) {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.warn("[LocalDB] Error saving local state file", err);
  }
}

// Generate DL-XXXX code
let orderCounter = 1;
function generatePublicCode(existingCodes: string[]): string {
  while (true) {
    const code = `DL-${String(orderCounter).padStart(4, "0")}`;
    orderCounter++;
    if (!existingCodes.includes(code)) {
      return code;
    }
  }
}

export class DbService {
  // 1. Settings
  static async getSettings(): Promise<Settings> {
    if (isServerSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer.from("settings").select("key, value");
      if (!error && data) {
        const settingsMap: any = { ...INITIAL_SETTINGS };
        for (const row of data) {
          if (row.key === "general" || row.key === "catalog" || row.key === "messages") {
            Object.assign(settingsMap, row.value);
          }
        }
        return settingsMap as Settings;
      }
    }
    return loadLocalState().settings;
  }

  static async updateSettings(newSettings: Partial<Settings>): Promise<Settings> {
    if (isServerSupabaseConfigured && supabaseServer) {
      const current = await this.getSettings();
      const merged = { ...current, ...newSettings };
      await supabaseServer.from("settings").upsert([
        {
          key: "general",
          value: {
            business_name: merged.business_name,
            whatsapp_number: merged.whatsapp_number,
            instagram_url: merged.instagram_url,
            address: merged.address,
            pickup_information: merged.pickup_information,
            delivery_information: merged.delivery_information,
          },
          updated_at: new Date().toISOString(),
        },
        {
          key: "catalog",
          value: {
            show_search: merged.catalog_show_search,
            show_prices: merged.catalog_show_prices,
            show_unavailable: merged.catalog_show_unavailable,
            special_order_cta_enabled: merged.special_order_cta_enabled,
            special_order_cta_text: merged.special_order_cta_text,
          },
          updated_at: new Date().toISOString(),
        },
      ]);
      return merged;
    }

    const state = loadLocalState();
    state.settings = { ...state.settings, ...newSettings };
    saveLocalState(state);
    return state.settings;
  }

  // 2. Categories
  static async getCategories(): Promise<Category[]> {
    if (isServerSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (!error && data) return data as Category[];
    }
    return loadLocalState().categories.sort((a, b) => a.sort_order - b.sort_order);
  }

  static async createCategory(categoryData: { name: string; slug: string; sort_order?: number }): Promise<Category> {
    const slug = categoryData.slug || categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const sort_order = categoryData.sort_order || 99;

    if (isServerSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from("categories")
        .insert({ name: categoryData.name, slug, sort_order, is_active: true })
        .select()
        .single();
      if (!error && data) return data as Category;
    }

    const state = loadLocalState();
    const newCat: Category = {
      id: `c-${Date.now()}`,
      name: categoryData.name,
      slug,
      sort_order,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    state.categories.push(newCat);
    saveLocalState(state);
    return newCat;
  }

  static async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    if (isServerSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from("categories")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) return data as Category;
    }

    const state = loadLocalState();
    const idx = state.categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    state.categories[idx] = { ...state.categories[idx], ...updates, updated_at: new Date().toISOString() };
    saveLocalState(state);
    return state.categories[idx];
  }

  // 3. Products
  static async getProducts(options?: {
    categorySlug?: string;
    includeUnavailable?: boolean;
    includeHidden?: boolean;
  }): Promise<Product[]> {
    if (isServerSupabaseConfigured && supabaseServer) {
      let query = supabaseServer
        .from("products")
        .select("*, variants:product_variants(*), category:categories(*)")
        .order("sort_order", { ascending: true });

      if (!options?.includeHidden) {
        query = query.eq("is_visible", true);
      }
      if (!options?.includeUnavailable) {
        query = query.eq("availability", "available");
      }

      const { data, error } = await query;
      if (!error && data) return data as Product[];
    }

    const state = loadLocalState();
    let prods = state.products.map((p) => ({
      ...p,
      variants: state.variants.filter((v) => v.product_id === p.id && v.is_active),
      category: state.categories.find((c) => c.id === p.category_id),
    }));

    if (!options?.includeHidden) {
      prods = prods.filter((p) => p.is_visible);
    }
    if (!options?.includeUnavailable) {
      prods = prods.filter((p) => p.availability === "available");
    }
    if (options?.categorySlug) {
      const cat = state.categories.find((c) => c.slug === options.categorySlug);
      if (cat) {
        prods = prods.filter((p) => p.category_id === cat.id);
      }
    }

    return prods.sort((a, b) => a.sort_order - b.sort_order);
  }

  static async getProductById(id: string): Promise<Product | null> {
    if (isServerSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from("products")
        .select("*, variants:product_variants(*), category:categories(*)")
        .eq("id", id)
        .single();
      if (!error && data) return data as Product;
    }

    const state = loadLocalState();
    const p = state.products.find((prod) => prod.id === id);
    if (!p) return null;
    return {
      ...p,
      variants: state.variants.filter((v) => v.product_id === p.id),
      category: state.categories.find((c) => c.id === p.category_id),
    };
  }

  static async updateProductPrice(id: string, newPrice: number): Promise<boolean> {
    if (isServerSupabaseConfigured && supabaseServer) {
      const { error } = await supabaseServer
        .from("products")
        .update({ base_price: newPrice, updated_at: new Date().toISOString() })
        .eq("id", id);
      return !error;
    }

    const state = loadLocalState();
    const prod = state.products.find((p) => p.id === id);
    if (prod) {
      prod.base_price = newPrice;
      prod.updated_at = new Date().toISOString();
      saveLocalState(state);
      return true;
    }
    return false;
  }

  static async updateProductAvailability(id: string, availability: Availability): Promise<boolean> {
    if (isServerSupabaseConfigured && supabaseServer) {
      const { error } = await supabaseServer
        .from("products")
        .update({ availability, updated_at: new Date().toISOString() })
        .eq("id", id);
      return !error;
    }

    const state = loadLocalState();
    const prod = state.products.find((p) => p.id === id);
    if (prod) {
      prod.availability = availability;
      prod.updated_at = new Date().toISOString();
      saveLocalState(state);
      return true;
    }
    return false;
  }

  static async toggleProductVisibility(id: string, is_visible: boolean): Promise<boolean> {
    if (isServerSupabaseConfigured && supabaseServer) {
      const { error } = await supabaseServer
        .from("products")
        .update({ is_visible, updated_at: new Date().toISOString() })
        .eq("id", id);
      return !error;
    }

    const state = loadLocalState();
    const prod = state.products.find((p) => p.id === id);
    if (prod) {
      prod.is_visible = is_visible;
      prod.updated_at = new Date().toISOString();
      saveLocalState(state);
      return true;
    }
    return false;
  }

  static async createProduct(productData: Partial<Product>): Promise<Product> {
    const id = `p-${Date.now()}`;
    const slug = productData.slug || (productData.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newProd: Product = {
      id,
      category_id: productData.category_id || "",
      name: productData.name || "Novo Produto",
      slug,
      description: productData.description || null,
      note: productData.note || null,
      unit_label: productData.unit_label || "UND",
      minimum_quantity: productData.minimum_quantity || 100,
      price_type: productData.price_type || "simple",
      base_price: productData.base_price !== undefined ? productData.base_price : null,
      availability: productData.availability || "available",
      is_visible: productData.is_visible !== undefined ? productData.is_visible : true,
      is_featured: false,
      sort_order: productData.sort_order || 99,
      image_url: productData.image_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isServerSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer.from("products").insert(newProd).select().single();
      if (!error && data) return data as Product;
    }

    const state = loadLocalState();
    state.products.push(newProd);
    saveLocalState(state);
    return newProd;
  }

  static async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    if (isServerSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from("products")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) return data as Product;
    }

    const state = loadLocalState();
    const idx = state.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    state.products[idx] = { ...state.products[idx], ...updates, updated_at: new Date().toISOString() };
    saveLocalState(state);
    return state.products[idx];
  }

  static async duplicateProduct(id: string): Promise<Product | null> {
    const original = await this.getProductById(id);
    if (!original) return null;
    return this.createProduct({
      ...original,
      name: `${original.name} (Cópia)`,
      slug: `${original.slug}-copia-${Date.now().toString().slice(-4)}`,
    });
  }

  // 4. Server-Side Order Creation (CRITICAL AUTHORITY)
  static async createOrder(orderInput: {
    customer: CustomerData;
    items: { productId: string; variantId?: string; quantity: number; note?: string }[];
  }): Promise<Order> {
    if (!orderInput.items || orderInput.items.length === 0) {
      throw new Error("O pedido não possui itens.");
    }
    if (!orderInput.customer.customerName?.trim() || !orderInput.customer.customerPhone?.trim()) {
      throw new Error("Nome e WhatsApp são obrigatórios.");
    }

    // Read full products list to validate from server authority
    const allProducts = await this.getProducts({ includeHidden: true, includeUnavailable: true });
    const orderItems: OrderItem[] = [];
    let calculatedTotal = 0;

    for (const item of orderInput.items) {
      const product = allProducts.find((p) => p.id === item.productId);
      if (!product) {
        throw new Error(`Produto não encontrado: ${item.productId}`);
      }
      if (product.availability !== "available") {
        throw new Error(`O item ${product.name} não está disponível no momento.`);
      }

      let unitPrice = 0;
      let unitLabel = product.unit_label;
      let variantNameSnapshot: string | null = null;
      let minQty = product.minimum_quantity;

      if (product.price_type === "variants") {
        if (!item.variantId) {
          throw new Error(`Variante não informada para o produto: ${product.name}`);
        }
        const variant = (product.variants || []).find((v) => v.id === item.variantId && v.is_active);
        if (!variant) {
          throw new Error(`Opção inválida ou inativa para: ${product.name}`);
        }
        unitPrice = Number(variant.price);
        unitLabel = variant.unit_label;
        variantNameSnapshot = variant.name;
        minQty = variant.minimum_quantity;
      } else {
        if (product.base_price === null || product.base_price === undefined) {
          throw new Error(`Preço não configurado para o produto: ${product.name}`);
        }
        unitPrice = Number(product.base_price);
      }

      // Quantity constraint check
      if (item.quantity < minQty) {
        throw new Error(`Quantidade mínima para ${product.name} é ${minQty} ${unitLabel}.`);
      }

      const subtotal = Number((unitPrice * item.quantity).toFixed(2));
      calculatedTotal += subtotal;

      orderItems.push({
        id: `oi-${Date.now()}-${Math.random().toString().slice(-4)}`,
        order_id: "",
        product_id: product.id,
        variant_id: item.variantId || null,
        product_name_snapshot: product.name,
        variant_name_snapshot: variantNameSnapshot,
        unit_label_snapshot: unitLabel,
        unit_price_snapshot: unitPrice,
        quantity: item.quantity,
        subtotal: subtotal,
        note: item.note || null,
      });
    }

    const state = loadLocalState();
    const existingCodes = isServerSupabaseConfigured && supabaseServer
      ? (await supabaseServer.from("orders").select("public_code")).data?.map((o) => o.public_code) || []
      : state.orders.map((o) => o.public_code);

    const publicCode = generatePublicCode(existingCodes);
    const orderId = `ord-${Date.now()}`;

    const newOrder: Order = {
      id: orderId,
      public_code: publicCode,
      customer_name: orderInput.customer.customerName.trim(),
      customer_phone: orderInput.customer.customerPhone.trim(),
      desired_date: orderInput.customer.desiredDate,
      fulfillment_type: orderInput.customer.fulfillmentType,
      delivery_address: orderInput.customer.deliveryAddress?.trim() || null,
      customer_note: orderInput.customer.customerNote?.trim() || null,
      total: Number(calculatedTotal.toFixed(2)),
      status: "generated",
      whatsapp_status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: orderItems.map((oi) => ({ ...oi, order_id: orderId })),
    };

    if (isServerSupabaseConfigured && supabaseServer) {
      const { error: ordError } = await supabaseServer.from("orders").insert({
        id: newOrder.id,
        public_code: newOrder.public_code,
        customer_name: newOrder.customer_name,
        customer_phone: newOrder.customer_phone,
        desired_date: newOrder.desired_date,
        fulfillment_type: newOrder.fulfillment_type,
        delivery_address: newOrder.delivery_address,
        customer_note: newOrder.customer_note,
        total: newOrder.total,
        status: newOrder.status,
        whatsapp_status: newOrder.whatsapp_status,
      });

      if (!ordError) {
        await supabaseServer.from("order_items").insert(
          orderItems.map((oi) => ({
            id: oi.id,
            order_id: newOrder.id,
            product_id: oi.product_id,
            variant_id: oi.variant_id,
            product_name_snapshot: oi.product_name_snapshot,
            variant_name_snapshot: oi.variant_name_snapshot,
            unit_label_snapshot: oi.unit_label_snapshot,
            unit_price_snapshot: oi.unit_price_snapshot,
            quantity: oi.quantity,
            subtotal: oi.subtotal,
            note: oi.note,
          }))
        );
      }
    }

    state.orders.unshift(newOrder);
    saveLocalState(state);
    return newOrder;
  }

  // 5. Orders management
  static async getOrders(): Promise<Order[]> {
    if (isServerSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from("orders")
        .select("*, items:order_items(*)")
        .order("created_at", { ascending: false });
      if (!error && data) return data as Order[];
    }
    return loadLocalState().orders;
  }

  static async getOrderByCode(code: string): Promise<Order | null> {
    if (isServerSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("public_code", code)
        .single();
      if (!error && data) return data as Order;
    }
    const state = loadLocalState();
    return state.orders.find((o) => o.public_code === code) || null;
  }

  static async updateOrderStatus(orderId: string, status: Order["status"]): Promise<boolean> {
    if (isServerSupabaseConfigured && supabaseServer) {
      const { error } = await supabaseServer
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId);
      return !error;
    }

    const state = loadLocalState();
    const ord = state.orders.find((o) => o.id === orderId);
    if (ord) {
      ord.status = status;
      ord.updated_at = new Date().toISOString();
      saveLocalState(state);
      return true;
    }
    return false;
  }

  // 6. Dashboard metrics (REAL DB QUERY, NO HARDCODING)
  static async getDashboardMetrics() {
    const products = await this.getProducts({ includeHidden: true, includeUnavailable: true });
    const orders = await this.getOrders();

    const availableProducts = products.filter((p) => p.availability === "available" && p.is_visible).length;
    const unavailableProducts = products.filter((p) => p.availability === "unavailable").length;
    const hiddenProducts = products.filter((p) => !p.is_visible).length;

    // Today's orders
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter((o) => o.created_at.slice(0, 10) === today).length;

    return {
      availableProducts,
      unavailableProducts,
      hiddenProducts,
      todayOrders,
      totalOrders: orders.length,
      recentOrders: orders.slice(0, 5),
    };
  }
}
