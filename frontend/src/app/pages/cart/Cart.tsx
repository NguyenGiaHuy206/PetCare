import { Link } from "react-router";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { CartItem, getCart, saveCart } from "../../utils/cart";

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setCartItems(getCart());
    const onUpdate = () => setCartItems(getCart());
    window.addEventListener("cart-updated", onUpdate);
    return () => window.removeEventListener("cart-updated", onUpdate);
  }, []);

  const updateQuantity = (id: string, delta: number) => {
    const updated = cartItems.map(item =>
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    );
    setCartItems(updated);
    saveCart(updated);
    window.dispatchEvent(new Event("cart-updated"));
  };

  const removeItem = (id: string) => {
    const updated = cartItems.filter(item => item.id !== id);
    setCartItems(updated);
    saveCart(updated);
    window.dispatchEvent(new Event("cart-updated"));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + tax + shipping;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products to get started</p>
            <Link to="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map(item => (
              <div key={item.id} className="bg-white rounded-lg border p-4 flex gap-4">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-24 h-24 object-cover rounded-lg" />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{item.name}</h3>
                  <p className="text-lg font-bold text-gray-900 mb-3">${item.price.toFixed(2)}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-2 hover:bg-gray-100">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 py-2 border-x border-gray-300">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-2 hover:bg-gray-100">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</span>
                </div>
                {subtotal < 50 && (
                  <p className="text-sm text-blue-600">
                    Add ${(50 - subtotal).toFixed(2)} more for free shipping!
                  </p>
                )}
              </div>
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              <Link
                to="/checkout"
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
              >
                Proceed to Checkout
              </Link>
              <Link
                to="/shop"
                className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center mt-3"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}