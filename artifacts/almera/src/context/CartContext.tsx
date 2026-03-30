import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Product } from '@workspace/api-client-react';

export interface CartItem {
  product: Product;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addItem: (product: Product, size: string, color: string) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('almera_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('almera_cart', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: Product, size: string, color: string) => {
    setItems(prev => {
      const existing = prev.find(
        i => i.product.id === product.id && i.selectedSize === size && i.selectedColor === color
      );
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id && i.selectedSize === size && i.selectedColor === color
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1, selectedSize: size, selectedColor: color }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: string, size: string, color: string) => {
    setItems(prev => prev.filter(
      i => !(i.product.id === productId && i.selectedSize === size && i.selectedColor === color)
    ));
  }, []);

  const updateQuantity = useCallback((productId: string, size: string, color: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId, size, color);
      return;
    }
    setItems(prev => prev.map(i =>
      i.product.id === productId && i.selectedSize === size && i.selectedColor === color
        ? { ...i, quantity: qty }
        : i
    ));
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.discountedPrice * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, isOpen, setIsOpen, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
