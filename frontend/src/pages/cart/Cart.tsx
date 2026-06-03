import { Link } from "react-router";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cartAPI, CartItem as BackendCartItem } from "../../services/carts";
import { productAPI } from "../../services/products";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ToastProvider";
import { formatVnd } from "../../utils/format";
import { getImageSrc } from "../../utils/images";

interface CartItemWithProduct extends BackendCartItem {
  product_name?: string;
  product_image?: string;
}

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const cart = await cartAPI.getCart();
      
      // Fetch product details for each item
      const itemsWithProducts = await Promise.all(
        cart.items.map(async (item) => {
          try {
            const product = await productAPI.getById(item.product_id);
            return {
              ...item,
              product_name: product.name,
              product_image: product.image_url,
            };
          } catch {
            return item;
          }
        })
      );
      
      setCartItems(itemsWithProducts);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    try {
      setUpdating(itemId);
      await cartAPI.updateCartItem(itemId, newQuantity);
      await loadCart();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update quantity");
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setUpdating(itemId);
      await cartAPI.removeFromCart(itemId);
      await loadCart();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to remove item");
    } finally {
      setUpdating(null);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price_at_add * item.quantity, 0);
  const vat = subtotal * 0.08;
  const total = subtotal + vat;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

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

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map(item => (
              <div key={item.id} className="bg-white rounded-lg border p-4 flex gap-4">
                {item.product_image ? (
                  <img src={getImageSrc(item.product_image)} alt={item.product_name} className="w-24 h-24 object-cover rounded-lg" />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{item.product_name || 'Product'}</h3>
                  <p className="text-lg font-bold text-gray-900 mb-3">{formatVnd(item.price_at_add)}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={updating === item.id} className="p-2 hover:bg-gray-100 disabled:opacity-50">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 py-2 border-x border-gray-300">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={updating === item.id} className="p-2 hover:bg-gray-100 disabled:opacity-50">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id)} disabled={updating === item.id} className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {formatVnd(item.price_at_add * item.quantity)}
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
                  <span>{formatVnd(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>VAT (8%)</span>
                  <span>{formatVnd(vat)}</span>
                </div>
              </div>
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatVnd(total)}</span>
                </div>
              </div>
              {isAuthenticated ? (
                <Link to="/checkout" className="block w-full px-6 py-3 rounded-lg text-center bg-blue-600 text-white hover:bg-blue-700">
                  Proceed to Checkout
                </Link>
              ) : (
                <button type="button" onClick={() => toast.info("Please register or sign in before checkout.")} className="block w-full px-6 py-3 rounded-lg text-center bg-gray-200 text-gray-500">
                  Proceed to Checkout
                </button>
              )}
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
