export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
};

const CART_KEY = "petty_cart";

export function getCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(item: Omit<CartItem, "quantity">, quantity: number = 1) {
  const cart = getCart();
  const existing = cart.find((i) => i.id === item.id);
  const normalizedQuantity = Math.max(1, quantity);

  if (existing) {
    existing.quantity += normalizedQuantity;
  } else {
    cart.push({ ...item, quantity: normalizedQuantity });
  }
  saveCart(cart);
  window.dispatchEvent(new Event("cart-updated"));
}

export function clearCart() {
  saveCart([]);
  window.dispatchEvent(new Event("cart-updated"));
}
