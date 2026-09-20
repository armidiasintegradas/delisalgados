"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem, Product, ProductVariant, CustomerData } from "@/types";
import { quantityStep } from "@/lib/orderRules";

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, variant?: ProductVariant, note?: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  setExactQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalAmount: number;
  totalUnits: number;
  customerData: CustomerData;
  setCustomerData: React.Dispatch<React.SetStateAction<CustomerData>>;
}

const defaultCustomerData: CustomerData = {
  customerName: "",
  customerPhone: "",
  desiredDate: "",
  fulfillmentType: "pickup",
  deliveryAddress: "",
  customerNote: "",
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData>(defaultCustomerData);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      if (
        typeof window !== "undefined" &&
        process.env.NODE_ENV !== "production" &&
        window.location.search.includes("mock_cart=stitch")
      ) {
        const stitchCart: CartItem[] = [
          {
            id: "p0000000-0000-0000-0000-000000000031",
            productId: "p0000000-0000-0000-0000-000000000031",
            productName: "Coxinha",
            unitPrice: 1.7,
            unitLabel: "UND",
            minimumQuantity: 25,
            quantity: 25,
            subtotal: 42.5,
          },
          {
            id: "p0000000-0000-0000-0000-000000000038",
            productId: "p0000000-0000-0000-0000-000000000038",
            productName: "Bolinho de Queijo",
            unitPrice: 2.0,
            unitLabel: "UND",
            minimumQuantity: 25,
            quantity: 25,
            subtotal: 50.0,
          },
          {
            id: "p0000000-0000-0000-0000-000000000036",
            productId: "p0000000-0000-0000-0000-000000000036",
            productName: "Camarão Empanado",
            variantId: "v0000000-0000-0000-0000-000000000351",
            variantName: "Congelado",
            unitPrice: 175.0,
            unitLabel: "1 kg",
            minimumQuantity: 1,
            quantity: 1,
            subtotal: 175.0,
          },
        ];
        setItems(stitchCart);
        setCustomerData({
          customerName: "Maria Silva",
          customerPhone: "(81) 98765-4321",
          desiredDate: new Date().toISOString().split("T")[0],
          fulfillmentType: "pickup",
          deliveryAddress: "",
          customerNote: "",
        });
        setIsInitialized(true);
        return;
      }

      const savedCart = localStorage.getItem("deli_cart_v1");
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
      const savedCustomer = localStorage.getItem("deli_customer_v1");
      if (savedCustomer) {
        setCustomerData(JSON.parse(savedCustomer));
      }
    } catch (e) {
      console.warn("Could not parse saved cart/customer data", e);
    }
    setIsInitialized(true);
  }, []);


  // Save to localStorage when state updates
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem("deli_cart_v1", JSON.stringify(items));
    } catch (e) {
      console.warn("Could not save cart data", e);
    }
  }, [items, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem("deli_customer_v1", JSON.stringify(customerData));
    } catch (e) {
      console.warn("Could not save customer data", e);
    }
  }, [customerData, isInitialized]);

  const addItem = (product: Product, quantity?: number, variant?: ProductVariant, note?: string) => {
    const minQty = variant ? variant.minimum_quantity : product.minimum_quantity;
    const initialQty = quantity !== undefined && quantity >= minQty ? quantity : minQty;
    const price = variant ? variant.price : (product.base_price || 0);
    const unitLabel = variant ? variant.unit_label : product.unit_label;
    const itemId = variant ? `${product.id}:${variant.id}` : product.id;

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === itemId);
      if (existingIdx > -1) {
        const updated = [...prev];
        const currentItem = updated[existingIdx];
        const step = quantityStep(minQty, unitLabel);
        const newQty = currentItem.quantity + (quantity || step);
        updated[existingIdx] = {
          ...currentItem,
          quantity: newQty,
          subtotal: Number((price * newQty).toFixed(2)),
          note: note !== undefined ? note : currentItem.note,
        };
        return updated;
      }

      const newItem: CartItem = {
        id: itemId,
        productId: product.id,
        variantId: variant?.id,
        productName: product.name,
        variantName: variant?.name,
        unitPrice: price,
        unitLabel: unitLabel,
        minimumQuantity: minQty,
        quantity: initialQty,
        subtotal: Number((price * initialQty).toFixed(2)),
        note: note || undefined,
      };
      return [...prev, newItem];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.id !== id) return item;
          const baseStep = quantityStep(item.minimumQuantity, item.unitLabel);
          const step = delta > 0 ? baseStep : -baseStep;
          const newQty = item.quantity + step;

          // If lowered below minimum quantity, remove the item
          if (newQty < item.minimumQuantity) {
            return null;
          }

          return {
            ...item,
            quantity: newQty,
            subtotal: Number((item.unitPrice * newQty).toFixed(2)),
          };
        })
        .filter((i): i is CartItem => i !== null);
    });
  };

  const setExactQuantity = (id: string, qty: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.id !== id) return item;
          if (qty < item.minimumQuantity) {
            return null;
          }
          return {
            ...item,
            quantity: qty,
            subtotal: Number((item.unitPrice * qty).toFixed(2)),
          };
        })
        .filter((i): i is CartItem => i !== null);
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem("deli_cart_v1");
    } catch {}
  };

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        setExactQuantity,
        removeItem,
        clearCart,
        totalAmount,
        totalUnits,
        customerData,
        setCustomerData,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
