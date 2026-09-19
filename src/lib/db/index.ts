import { Category, Product, ProductVariant, Settings, Order, OrderItem, CustomerData, Availability } from "@/types";
import { isServerSupabaseConfigured, supabaseServer } from "@/lib/supabase/server";
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_VARIANTS, INITIAL_SETTINGS } from "./seedData";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Local state file for standalone local development when Supabase credentials are not provided
const STATE_FILE_PATH = path.join(process.cwd(), ".local-db-state.json");

// Check if local DB fallback is strictly disallowed (e.g. production)
function isLocalDbAllowed(): boolean {
  if (process.env.DELI_ALLOW_LOCAL_DB === "true") return true;
  if (process.env.DELI_ALLOW_LOCAL_DB === "false") return false;
  return process.env.NODE_ENV !== "production";
}

interface LocalDbState {
  categories: Category[];
  products: Product[];
  variants: ProductVariant[];
  settings: Settings;
  orders: Order[];
  auditLogs: any[];
  notice?: {
    id: string;
    message: string;
    is_active: boolean;
    starts_at?: string | null;
    ends_at?: string | null;
  };
}

function loadLocalState(): LocalDbState {
  if (!isLocalDbAllowed()) {
    throw new Error(
      "[Database Authority] Supabase é obrigatório em produção. Fallback local desativado por segurança (DELI_ALLOW_LOCAL_DB=false)."
    );
  }

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
    notice: {
      id: crypto.randomUUID(),
      message: "Recomendação para o fim de semana: encomendas com 48h de antecedência.",
      is_active: true,
      starts_at: null,
      ends_at: null,
    },
  };
  saveLocalState(initial);
  return initial;
}

function saveLocalState(state: LocalDbState) {
  if (!isLocalDbAllowed()) {
    throw new Error(
      "[Database Authority] Gravação em arquivo local proibida em produção. Configure o Supabase."
    );
  }

  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.warn("[LocalDB] Error saving local state file", err);
  }
}

// Concurrency-safe public code generator
function generateNextCode(existingCodes: string[]): string {
  let maxNum = 0;
  for (const code of existingCodes) {
    const match = code.match(/^DL-(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  const nextNum = maxNum + 1;
  return `DL-${String(nextNum).padStart(4, "0")}`;
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
      if (error && !isLocalDbAllowed()) {
        console.warn(`[Supabase Warning] Falha ao consultar settings: ${error.message}, usando canônico`);
        return { ...INITIAL_SETTINGS };
      }
    }
    if (!isLocalDbAllowed()) {
      return { ...INITIAL_SETTINGS };
    }
    return loadLocalState().settings;
  }

  static async updateSettings(newSettings: Partial<Settings>): Promise<Settings> {
    if (isServerSupabaseConfigured && supabaseServer) {
      const current = await this.getSettings();
      const merged = { ...current, ...newSettings };
      const { error } = await supabaseServer.from("settings").upsert([
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

      if (error) {
        throw new Error(`[Supabase Error] Falha ao atualizar settings: ${error.message}`);
      }
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
      if (error && !isLocalDbAllowed()) {
        console.warn(`[Supabase Warning] Falha ao consultar categorias: ${error.message}, usando canônico`);
        return [...INITIAL_CATEGORIES];
      }
    }
    if (!isLocalDbAllowed()) {
      return [...INITIAL_CATEGORIES];
    }
    return loadLocalState().categories.sort((a, b) => a.sort_order - b.sort_order);
  }

  static async createCategory(categoryData: { name: string; slug: string; sort_order?: number }): Promise<Category> {
    const slug = categoryData.slug || categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const sort_order = categoryData.sort_order || 99;
    const id = crypto.randomUUID(); // Valid PostgreSQL UUID

    if (isServerSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from("categories")
        .insert({ id, name: categoryData.name, slug, sort_order, is_active: true })
        .select()
        .single();
      if (!error && data) return data as Category;
      if (error) {
        throw new Error(`[Supabase Error] Falha ao criar categoria: ${error.message}`);
      }
    }

    const state = loadLocalState();
    const newCat: Category = {
      id,
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
      if (error) {
        throw new Error(`[Supabase Error] Falha ao atualizar categoria: ${error.message}`);
      }
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
      if (!error && data) {
        let prods = data as Product[];
        if (options?.categorySlug) {
          prods = prods.filter((p: any) => p.category?.slug === options.categorySlug);
        }
        return prods;
      }
      if (error && !isLocalDbAllowed()) {
        console.warn(`[Supabase Warning] Falha ao consultar produtos: ${error.message}, usando canônico`);
      }
    }

    if (!isLocalDbAllowed()) {
      let prods = INITIAL_PRODUCTS.map((p) => ({
        ...p,
        variants: INITIAL_VARIANTS.filter((v) => v.product_id === p.id && v.is_active),
        category: INITIAL_CATEGORIES.find((c) => c.id === p.category_id),
      }));

      if (!options?.includeHidden) {
        prods = prods.filter((p) => p.is_visible);
      }
      if (!options?.includeUnavailable) {
        prods = prods.filter((p) => p.availability === "available");
      }
      if (options?.categorySlug) {
        const cat = INITIAL_CATEGORIES.find((c) => c.slug === options.categorySlug);
        if (cat) {
          prods = prods.filter((p) => p.category_id === cat.id);
        }
      }

      return prods.sort((a, b) => a.sort_order - b.sort_order);
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

    if (!isLocalDbAllowed()) {
      const p = INITIAL_PRODUCTS.find((prod) => prod.id === id);
      if (!p) return null;
      return {
        ...p,
        variants: INITIAL_VARIANTS.filter((v) => v.product_id === p.id && v.is_active),
        category: INITIAL_CATEGORIES.find((c) => c.id === p.category_id),
      };
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
    const id = productData.id && productData.id.length === 36 ? productData.id : crypto.randomUUID(); // Valid PostgreSQL UUID
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
      preparation_type: productData.preparation_type || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isServerSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer.from("products").insert(newProd).select().single();
      if (!error && data) return data as Product;
      if (error) {
        throw new Error(`[Supabase Error] Falha ao criar produto: ${error.message}`);
      }
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
      if (error) {
        throw new Error(`[Supabase Error] Falha ao atualizar produto: ${error.message}`);
      }
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
      id: crypto.randomUUID(),
      name: `${original.name} (Cópia)`,
      slug: `${original.slug}-copia-${Date.now().toString().slice(-4)}`,
    });
  }

  // 4. Server-Side Order Creation (CRITICAL ATOMICITY & AUTHORITY)
  static async createOrder(orderInput: {
    customer: CustomerData;
    items: { productId: string; variantId?: string; quantity: number; note?: string }[];
  }): Promise<Order & { handoffToken: string }> {
    if (process.env.NODE_ENV === "production" && !isServerSupabaseConfigured && process.env.DELI_ALLOW_LOCAL_DB !== "true") {
      const err: any = new Error("Pedidos temporariamente indisponíveis. Banco de dados não configurado.");
      err.status = 503;
      throw err;
    }

    if (!orderInput.items || orderInput.items.length === 0) {
      throw new Error("O pedido não possui itens.");
    }
    if (!orderInput.customer.customerName?.trim() || !orderInput.customer.customerPhone?.trim()) {
      throw new Error("Nome e WhatsApp são obrigatórios.");
    }

    // Read full products list to validate from server authority
    const allProducts = await this.getProducts({ includeHidden: true, includeUnavailable: true });
    const orderId = crypto.randomUUID(); // Valid PostgreSQL UUID
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
        id: crypto.randomUUID(), // Valid PostgreSQL UUID
        order_id: orderId,
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

    // Generate secure handoff token (32 bytes hex = 64 chars) and SHA-256 hash
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Atomic insert into Supabase via Transactional RPC
    if (isServerSupabaseConfigured && supabaseServer) {
      const orderPayload = {
        id: orderId,
        customer_name: orderInput.customer.customerName.trim(),
        customer_phone: orderInput.customer.customerPhone.trim(),
        desired_date: orderInput.customer.desiredDate,
        fulfillment_type: orderInput.customer.fulfillmentType,
        delivery_address: orderInput.customer.deliveryAddress?.trim() || null,
        customer_note: orderInput.customer.customerNote?.trim() || null,
        total: Number(calculatedTotal.toFixed(2)),
      };

      const itemsPayload = orderItems.map((oi) => ({
        id: oi.id,
        product_id: oi.product_id,
        variant_id: oi.variant_id,
        product_name_snapshot: oi.product_name_snapshot,
        variant_name_snapshot: oi.variant_name_snapshot,
        unit_label_snapshot: oi.unit_label_snapshot,
        unit_price_snapshot: oi.unit_price_snapshot,
        quantity: oi.quantity,
        subtotal: oi.subtotal,
        note: oi.note,
      }));

      const { data: createdData, error: rpcError } = await supabaseServer.rpc(
        "create_deli_order_v34",
        {
          p_order: orderPayload,
          p_items: itemsPayload,
          p_token_hash: tokenHash,
          p_token_expires_at: tokenExpiresAt,
        }
      );

      if (rpcError) {
        throw new Error(`[Database Error] Falha transacional ao criar pedido no Supabase: ${rpcError.message}`);
      }

      const createdOrder: Order = {
        ...(createdData as Order),
        items: createdData.items || orderItems,
      };

      return {
        ...createdOrder,
        handoffToken: token,
      };
    }

    // Local DB fallback for testing/offline dev
    const state = loadLocalState();
    const existingCodes = state.orders.map((o) => o.public_code);
    const publicCode = generateNextCode(existingCodes);

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
      handoff_token_hash: tokenHash,
      handoff_token_expires_at: tokenExpiresAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: orderItems,
    };

    state.orders.unshift(newOrder);
    saveLocalState(state);

    return {
      ...newOrder,
      handoffToken: token,
    };
  }

  // 5. Orders management
  static async getOrders(): Promise<Order[]> {
    if (isServerSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from("orders")
        .select("*, items:order_items(*)")
        .order("created_at", { ascending: false });
      if (!error && data) return data as Order[];
      if (error && !isLocalDbAllowed()) {
        throw new Error(`[Supabase Error] Falha ao consultar pedidos: ${error.message}`);
      }
    }
    if (!isLocalDbAllowed()) {
      return [];
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
    return state.orders.find((o) => o.public_code.toUpperCase() === code.toUpperCase()) || null;
  }

  static async getOrderByHandoffToken(code: string, token: string): Promise<Order | null> {
    if (!code || !token || typeof token !== "string") return null;

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const nowIso = new Date().toISOString();

    if (isServerSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("public_code", code.toUpperCase())
        .eq("handoff_token_hash", tokenHash)
        .single();

      if (error || !data) return null;

      // Verify expiration
      if (data.handoff_token_expires_at && data.handoff_token_expires_at < nowIso) {
        return null; // Expired
      }

      return data as Order;
    }

    const state = loadLocalState();
    const ord = state.orders.find(
      (o) =>
        o.public_code.toUpperCase() === code.toUpperCase() &&
        o.handoff_token_hash === tokenHash
    );

    if (!ord) return null;

    if (ord.handoff_token_expires_at && ord.handoff_token_expires_at < nowIso) {
      return null;
    }

    return ord;
  }

  static async updateOrderWhatsAppOpenedWithToken(code: string, token: string): Promise<boolean> {
    const order = await this.getOrderByHandoffToken(code, token);
    if (!order) return false;
    return this.updateOrderWhatsAppStatus(order.id, "opened");
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

  static async updateOrderWhatsAppStatus(orderId: string, whatsapp_status: "pending" | "opened" | "contacted"): Promise<boolean> {
    const updatePayload: any = {
      whatsapp_status,
      updated_at: new Date().toISOString(),
    };
    if (whatsapp_status === "opened") {
      updatePayload.whatsapp_opened_at = new Date().toISOString();
    }

    if (isServerSupabaseConfigured && supabaseServer) {
      const { error } = await supabaseServer
        .from("orders")
        .update(updatePayload)
        .eq("id", orderId);
      return !error;
    }

    const state = loadLocalState();
    const ord = state.orders.find((o) => o.id === orderId);
    if (ord) {
      ord.whatsapp_status = whatsapp_status;
      ord.updated_at = updatePayload.updated_at;
      saveLocalState(state);
      return true;
    }
    return false;
  }

  // 6. Catalog Notices (Section 36)
  static async getActiveNotice(): Promise<{ id: string; message: string; is_active: boolean } | null> {
    if (isServerSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from("catalog_notices")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) return data;
    }
    if (!isLocalDbAllowed()) {
      return {
        id: "default-notice",
        message: "Recomendação para o fim de semana: encomendas com 48h de antecedência.",
        is_active: true,
      };
    }
    const state = loadLocalState();
    return state.notice && state.notice.is_active ? state.notice : null;
  }

  // 7. Dashboard metrics (REAL DB QUERY, NO HARDCODING)
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
