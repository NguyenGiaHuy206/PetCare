import { Link } from "react-router";
import { ShoppingCart, Star, Search, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { productAPI, ProductResponse } from "../../utils/api";
import { addToCart } from "../../utils/cart";

const placeholderImage = "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800";

export default function Shop() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categories = ["All", "Food", "Toys", "Accessories", "Furniture", "Grooming"];

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await productAPI.getAll(0, 50, search || undefined);
        setProducts(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [search]);

  const filteredProducts = products.filter((product) =>
    category === "All"
      ? true
      : product.description?.toLowerCase().includes(category.toLowerCase()) ||
        product.name.toLowerCase().includes(category.toLowerCase())
  );

  const handleAddToCart = (product: ProductResponse) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url ?? undefined,
    });
    window.alert(`${product.name} added to cart.`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pet Shop</h1>
          <p className="text-gray-600">Find everything your pet needs</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition"
            >
              <Link to={`/shop/${product.id}`}>
                <img
                  src={product.image_url ?? placeholderImage}
                  alt={product.name}
                  className="w-full h-48 object-cover hover:opacity-90 transition"
                />
              </Link>
              <div className="p-4">
                <Link to={`/shop/${product.id}`}>
                  <h3 className="font-semibold text-gray-900 mb-1 hover:text-blue-600 transition">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {product.description || "No description available"}
                </p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-gray-900">
                    ${product.price.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">4.5</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/shop/${product.id}`}
                    className="flex-1 text-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
                {product.stock === 0 && (
                  <p className="text-sm text-red-600 mt-2">Out of stock</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && !error && (
          <div className="text-center py-12 bg-white rounded-lg border">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}