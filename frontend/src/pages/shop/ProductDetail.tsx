import { Link, useParams } from "react-router";
import { ShoppingCart, Star, Truck, Shield, ArrowLeft, Plus, Minus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { productAPI, ProductResponse } from "../../services/products";
import { cartAPI } from "../../services/carts";
import { useAuth } from "../../contexts/AuthContext";

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await productAPI.getById(id);
        setProduct(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      setAddingToCart(true);
      await cartAPI.addToCart(product.id, quantity);
      setQuantity(1);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to add item to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/shop" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
          <div className="bg-white rounded-lg border p-6 text-center text-gray-700">{error || 'Product not found.'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/shop" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </Link>

        <div className="bg-white rounded-lg border p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full rounded-lg object-cover h-[28rem]"
                />
              ) : (
                <div className="w-full rounded-lg h-[28rem] bg-gray-100" aria-hidden="true" />
              )}
            </div>

            <div>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded mb-3">
                Product
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(product.stock > 0 ? 5 : 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-medium text-gray-900">{product.price.toFixed(2)}</span>
              </div>

              <p className="text-gray-600 mb-6">{product.description ?? 'No product description available.'}</p>

              {user?.role !== "admin" ? (
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-gray-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={product.stock === 0 || addingToCart}
                    onClick={handleAddToCart}
                    className={`px-6 py-3 rounded-lg text-white flex items-center justify-center gap-2 ${
                      product.stock === 0 || addingToCart ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {addingToCart ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        {product.stock === 0 ? 'Unavailable' : 'Add to Cart'}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Admin accounts can manage products but cannot add items to cart.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Fast shipping</p>
                    <p className="text-xs text-gray-600">Delivered in 2-4 days</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Secure checkout</p>
                    <p className="text-xs text-gray-600">Safe payment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
