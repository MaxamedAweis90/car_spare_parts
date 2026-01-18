"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageId?: string | null;
  imageUrl?: string | null;
};

type AddToCartInput = {
  id: string;
  name: string;
  price: number;
  imageId?: string | null;
  imageUrl?: string | null;
  quantity?: number;
};

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  count: number;
  total: number;
  openCart: () => void;
  closeCart: () => void;
  addItem: (input: AddToCartInput) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CART_KEY = "spareparts-cart-v1";

const CartContext = createContext<CartContextValue | null>(null);

function safeParseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x === "object")
      .map((x) => ({
        id: String((x as any).id),
        name: String((x as any).name ?? ""),
        price: Number((x as any).price ?? 0),
        quantity: Math.max(1, Number((x as any).quantity ?? 1)),
        imageId: (x as any).imageId ?? null,
        imageUrl: (x as any).imageUrl ?? null,
      }))
      .filter(
        (x) =>
          x.id &&
          x.name &&
          Number.isFinite(x.price) &&
          Number.isFinite(x.quantity)
      );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isRehydrated, setIsRehydrated] = useState(false);

  // Initialize from storage on mount
  useEffect(() => {
    const raw = localStorage.getItem(CART_KEY);
    if (raw) {
      setItems(safeParseCart(raw));
    }
    setIsRehydrated(true);
  }, []);

  // Save to storage whenever items change
  useEffect(() => {
    if (!isRehydrated) return; // Wait until initial load
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, isRehydrated]);

  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((input: AddToCartInput) => {
    const qty =
      input.quantity != null ? Math.max(1, Math.floor(input.quantity)) : 1;
    setItems((prev) => {
      const existingIndex = prev.findIndex((x) => x.id === input.id);
      if (existingIndex >= 0) {
        const next = [...prev];
        const existing = next[existingIndex];
        next[existingIndex] = {
          ...existing,
          quantity: existing.quantity + qty,
        };
        return next;
      }
      return [
        ...prev,
        {
          id: input.id,
          name: input.name,
          price: input.price,
          quantity: qty,
          imageId: input.imageId ?? null,
          imageUrl: input.imageUrl ?? null,
        },
      ];
    });
  }, []);

  const increment = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, quantity: x.quantity + 1 } : x))
    );
  }, []);

  const decrement = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev
        .map((x) => (x.id === id ? { ...x, quantity: x.quantity - 1 } : x))
        .filter((x) => x.quantity > 0);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value: CartContextValue = useMemo(
    () => ({
      items,
      isOpen,
      count,
      total,
      openCart,
      closeCart,
      addItem,
      increment,
      decrement,
      remove,
      clear,
    }),
    [
      items,
      isOpen,
      count,
      total,
      openCart,
      closeCart,
      addItem,
      increment,
      decrement,
      remove,
      clear,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

