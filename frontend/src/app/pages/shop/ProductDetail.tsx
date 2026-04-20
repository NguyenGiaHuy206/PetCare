import { Link, useParams } from "react-router";
import { ShoppingCart, Star, Truck, Shield, ArrowLeft, Plus, Minus } from "lucide-react";
import { useState } from "react";

export default function ProductDetail() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);

  const product = {
    id: 1,
    name: "Premium Dog Food",
    category: "Food",
    price: 45.99,
    rating: 4.8,
    reviews: 234,
    image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600",
    description: "High-quality premium dog food made with real meat and wholesome ingredients. Perfect for adult dogs of all breeds. Rich in proteins, vitamins, and minerals to keep your dog healthy and energetic.",
    inStock: true,
    features: [
      "100% natural ingredients",
      "No artificial preservatives",
      "Rich in protein (25%)",
      "Supports healthy digestion",
      "Omega-3 for shiny coat",
    ],
    specifications: {
      weight: "15 kg",
      ingredients: "Chicken, Rice, Vegetables, Vitamins",
      age: "Adult (1-7 years)",
      breed: "All breeds",
    },
  };

  const relatedProducts = [
    { id: 2, name: "Dog Treats", price: 9.99, image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200" },
    { id: 3, name: "Food Bowl Set", price: 15.99, image: "https://images.unsplash.com/photo-1564510714747-69c3bc1fab41?w=200" },
    { id: 4, name: "Water Dispenser", price: 22.99, image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=200" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/shop" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </Link>

        <div className="bg-white rounded-lg border p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Image */}
            <div>
              <img src={product.image} alt={product.name} className="w-full rounded-lg" />
            </div>

            {/* Product Info */}
            <div>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded mb-3">
                {product.category}
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-medium text-gray-900">{product.rating}</span>
                <span className="text-gray-500">({product.reviews} reviews)</span>
              </div>

              <div className="text-3xl font-bold text-gray-900 mb-6">${product.price}</div>

              <p className="text-gray-600 mb-6">{product.description}</p>

              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-gray-900">Key Features:</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-700">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

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
                <Link
                  to="/cart"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Free Shipping</p>
                    <p className="text-xs text-gray-600">Orders over $50</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Quality Guarantee</p>
                    <p className="text-xs text-gray-600">30-day returns</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 capitalize">{key}</p>
                  <p className="font-medium text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map(related => (
              <Link
                key={related.id}
                to={`/shop/${related.id}`}
                className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition"
              >
                <img src={related.image} alt={related.name} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{related.name}</h3>
                  <p className="text-xl font-bold text-gray-900">${related.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
