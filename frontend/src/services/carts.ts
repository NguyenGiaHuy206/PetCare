import apiClient from "./apiClient";
import { tokenStorage } from "./tokenStorage";
import { productAPI } from "./products";

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  price_at_add: number;
  created_at: string;
}

export interface CartResponse {
  id: string;
  user_id: string;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

export interface CartTotalResponse {
  total: number;
}

const GUEST_CART_KEY = "petty_cart";

const readGuestCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeGuestCart = (items: CartItem[]) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

const emitCartUpdated = () => {
  window.dispatchEvent(new Event("cart-updated"));
};

const isAuthenticated = () => Boolean(tokenStorage.getToken());

const getGuestCartResponse = (): CartResponse => {
  const items = readGuestCart();
  const now = new Date().toISOString();
  return {
    id: "guest-cart",
    user_id: "guest",
    items,
    created_at: now,
    updated_at: now,
  };
};

export const cartAPI = {
  /**
   * Get current user's shopping cart
   */
  getCart: async (): Promise<CartResponse> => {
    if (!isAuthenticated()) {
      return getGuestCartResponse();
    }
    const response = await apiClient.get("/carts");
    return response.data;
  },

  /**
   * Add item to cart
   */
  addToCart: async (
    productId: string,
    quantity: number
  ): Promise<CartResponse> => {
    if (!isAuthenticated()) {
      const product = await productAPI.getById(productId);
      const items = readGuestCart();
      const existingIndex = items.findIndex((item) => item.product_id === productId);

      if (existingIndex >= 0) {
        items[existingIndex] = {
          ...items[existingIndex],
          quantity: items[existingIndex].quantity + quantity,
        };
      } else {
        items.push({
          id: `guest-${productId}`,
          product_id: productId,
          quantity,
          price_at_add: product.price,
          created_at: new Date().toISOString(),
        });
      }

      writeGuestCart(items);
      emitCartUpdated();
      return getGuestCartResponse();
    }

    const response = await apiClient.post("/carts/items", {
      product_id: productId,
      quantity,
    });
    emitCartUpdated();
    return response.data;
  },

  /**
   * Remove item from cart
   */
  removeFromCart: async (itemId: string): Promise<CartResponse> => {
    if (!isAuthenticated()) {
      const items = readGuestCart().filter((item) => item.id !== itemId);
      writeGuestCart(items);
      emitCartUpdated();
      return getGuestCartResponse();
    }

    const response = await apiClient.delete(`/carts/items/${itemId}`);
    emitCartUpdated();
    return response.data;
  },

  /**
   * Update item quantity in cart (use quantity=0 to remove)
   */
  updateCartItem: async (
    itemId: string,
    quantity: number
  ): Promise<CartResponse> => {
    if (!isAuthenticated()) {
      const items = readGuestCart();
      const nextItems = quantity <= 0
        ? items.filter((item) => item.id !== itemId)
        : items.map((item) => (item.id === itemId ? { ...item, quantity } : item));
      writeGuestCart(nextItems);
      emitCartUpdated();
      return getGuestCartResponse();
    }

    const response = await apiClient.patch(`/carts/items/${itemId}`, {
      quantity,
    });
    emitCartUpdated();
    return response.data;
  },

  /**
   * Clear all items from cart
   */
  clearCart: async (): Promise<CartResponse> => {
    if (!isAuthenticated()) {
      writeGuestCart([]);
      emitCartUpdated();
      return getGuestCartResponse();
    }

    const response = await apiClient.delete("/carts");
    emitCartUpdated();
    return response.data;
  },

  /**
   * Get total price for cart
   */
  getCartTotal: async (): Promise<CartTotalResponse> => {
    const response = await apiClient.get("/carts/total");
    return response.data;
  },
};
