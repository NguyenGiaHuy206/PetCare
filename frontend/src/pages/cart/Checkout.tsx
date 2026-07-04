import { Link, useNavigate } from "react-router";
import { CreditCard, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { orderAPI } from "../../services/orders";
import { cartAPI, CartItem as BackendCartItem } from "../../services/carts";
import { productAPI } from "../../services/products";
import { useAuth } from "../../contexts/AuthContext";
import { shippingAPI, type GhnDistrict, type GhnProvince, type GhnWard } from "../../services/shipping";
import { formatVnd } from "../../utils/format";
import type { PaymentMethod } from "../../services/types";

interface CartItemWithProduct extends BackendCartItem {
  product_name?: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [provinces, setProvinces] = useState<GhnProvince[]>([]);
  const [districts, setDistricts] = useState<GhnDistrict[]>([]);
  const [wards, setWards] = useState<GhnWard[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingQuoted, setShippingQuoted] = useState(false);
  const [shippingMeta, setShippingMeta] = useState("");
  const [shipping, setShipping] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("vnpay");
  const quoteRequestId = useRef(0);

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const data = await shippingAPI.getProvinces();
        setProvinces(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load GHN provinces.");
      }
    };
    if (isAuthenticated) {
      loadProvinces();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const loadDistricts = async () => {
      if (!provinceId) {
        setDistricts([]);
        return;
      }
      try {
        const data = await shippingAPI.getDistricts(Number(provinceId));
        setDistricts(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load GHN districts.");
      }
    };
    setDistrictId("");
    setWardCode("");
    setWards([]);
    setShipping(0);
    setShippingQuoted(false);
    setShippingMeta("");
    quoteRequestId.current += 1;
    loadDistricts();
  }, [provinceId]);

  useEffect(() => {
    const loadWards = async () => {
      if (!districtId) {
        setWards([]);
        return;
      }
      try {
        const data = await shippingAPI.getWards(Number(districtId));
        setWards(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load GHN wards.");
      }
    };
    setWardCode("");
    setShipping(0);
    setShippingQuoted(false);
    setShippingMeta("");
    quoteRequestId.current += 1;
    loadWards();
  }, [districtId]);

  useEffect(() => {
    const quoteShipping = async () => {
      const requestId = quoteRequestId.current + 1;
      quoteRequestId.current = requestId;
      if (!districtId || !wardCode) {
        setShipping(0);
        setShippingQuoted(false);
        setShippingMeta("");
        return;
      }
      try {
        setShippingLoading(true);
        const quote = await shippingAPI.quote(Number(districtId), wardCode);
        if (quoteRequestId.current !== requestId) return;
        setShipping(quote.service_fee);
        setShippingQuoted(true);
        setShippingMeta(`${quote.total_weight_gram}g, ${quote.length_cm}x${quote.width_cm}x${quote.height_cm}cm`);
        setError("");
      } catch (err: any) {
        if (quoteRequestId.current !== requestId) return;
        setShipping(0);
        setShippingQuoted(false);
        setShippingMeta("");
        setError(err.response?.data?.detail || "Failed to calculate delivery fee.");
      } finally {
        if (quoteRequestId.current === requestId) {
          setShippingLoading(false);
        }
      }
    };
    quoteShipping();
  }, [districtId, wardCode]);

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

  const subtotal = cartItems.reduce((sum, item) => sum + item.price_at_add * item.quantity, 0);
  const vat = subtotal * 0.08;
  const total = subtotal + vat + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError("Please sign in to complete checkout.");
      navigate("/login");
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty. Add products before checkout.");
      return;
    }

    if (!districtId || !wardCode) {
      setError("Please select province, district, and ward before checkout.");
      return;
    }

    if (shippingLoading) {
      setError("Please wait for delivery fee calculation to finish.");
      return;
    }

    if (!shippingQuoted) {
      setError("Delivery fee has not been calculated yet.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const items = cartItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));
      const response = await orderAPI.create(items, vat, shipping, paymentMethod);
      window.location.href = response.checkout_url;
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
            <p className="text-xl font-semibold text-gray-900 mb-4">Your cart is empty</p>
            <p className="text-gray-600 mb-6">Add products in the shop to start checkout.</p>
            <Link to="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/cart" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
                    <select
                      required
                      value={provinceId}
                      onChange={(e) => setProvinceId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select province</option>
                      {provinces.map((province) => (
                        <option key={province.ProvinceID} value={province.ProvinceID}>
                          {province.ProvinceName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                    <select
                      required
                      value={districtId}
                      onChange={(e) => setDistrictId(e.target.value)}
                      disabled={!provinceId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select district</option>
                      {districts.map((district) => (
                        <option key={district.DistrictID} value={district.DistrictID}>
                          {district.DistrictName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ward *</label>
                    <select
                      required
                      value={wardCode}
                      onChange={(e) => setWardCode(e.target.value)}
                      disabled={!districtId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select ward</option>
                      {wards.map((ward) => (
                        <option key={ward.WardCode} value={ward.WardCode}>
                          {ward.WardName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {provinces.length === 0 && (
                  <p className="mt-3 text-sm text-gray-600">GHN address lists require GHN_TOKEN to be configured.</p>
                )}
                {shippingMeta && <p className="mt-3 text-sm text-gray-600">Package: {shippingMeta}</p>}
              </div>

              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
                  <Lock className="w-4 h-4 text-green-600 ml-auto" />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment method</label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        { value: "vnpay", label: "VNPAY", desc: "Pay online through VNPAY." },
                        { value: "cod", label: "COD", desc: "Pay cash on delivery." },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className={`cursor-pointer rounded-lg border px-4 py-3 ${
                            paymentMethod === option.value ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment_method"
                            value={option.value}
                            checked={paymentMethod === option.value}
                            onChange={() => setPaymentMethod(option.value as PaymentMethod)}
                            className="sr-only"
                          />
                          <span className="block font-medium text-gray-900">{option.label}</span>
                          <span className="mt-1 block text-sm text-gray-600">{option.desc}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <p className="text-sm text-blue-800">Your payment information is encrypted and secure</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Place Order'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product_name || 'Product'} × {item.quantity}
                    </span>
                    <span className="text-gray-900">{formatVnd(item.price_at_add * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatVnd(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>VAT</span>
                  <span>{formatVnd(vat)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery fee</span>
                  <span>
                    {shippingLoading
                      ? "Calculating..."
                      : !districtId || !wardCode
                        ? "Select address"
                        : shippingQuoted
                          ? formatVnd(shipping)
                          : "Not calculated"}
                  </span>
                </div>
              </div>
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatVnd(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
