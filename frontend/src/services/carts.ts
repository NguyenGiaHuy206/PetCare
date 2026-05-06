import apiClient from "./apiClient";

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

const emitCartUpdated = () => {
  window.dispatchEvent(new Event("cart-updated"));
};

export const cartAPI = {
  /**
   * Get current user's shopping cart
   */
  getCart: async (): Promise<CartResponse> => {
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
