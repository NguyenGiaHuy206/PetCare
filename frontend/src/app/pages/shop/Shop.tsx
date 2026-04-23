import { Link } from "react-router";
import { ShoppingCart, Star, Search, Filter } from "lucide-react";

export default function Shop() {
  const products = [
    {
      id: 1,
      name: "Premium Dog Food",
      category: "Food",
      price: 45.99,
      rating: 4.8,
      reviews: 234,
      image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400",
      inStock: true,
    },
    {
      id: 2,
      name: "Interactive Cat Toy",
      category: "Toys",
      price: 12.99,
      rating: 4.5,
      reviews: 156,
      image: "https://images.unsplash.com/photo-1591160690555-5debfba289f0?w=400",
      inStock: true,
    },
    {
      id: 3,
      name: "Comfortable Pet Bed",
      category: "Accessories",
      price: 34.99,
      rating: 4.9,
      reviews: 412,
      image: "https://images.unsplash.com/photo-1564510714747-69c3bc1fab41?w=400",
      inStock: true,
    },
    {
      id: 4,
      name: "Leather Dog Collar",
      category: "Accessories",
      price: 18.99,
      rating: 4.6,
      reviews: 89,
      image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
      inStock: true,
    },
    {
      id: 5,
      name: "Cat Scratching Post",
      category: "Furniture",
      price: 29.99,
      rating: 4.7,
      reviews: 178,
      image: "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=400",
      inStock: false,
    },
    {
      id: 6,
      name: "Pet Grooming Kit",
      category: "Grooming",
      price: 24.99,
      rating: 4.4,
      reviews: 203,
      image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400",
      inStock: true,
    },
  ];

  const categories = ["All", "Food", "Toys", "Accessories", "Furniture", "Grooming"];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pet Shop</h1>
          <p className="text-gray-600">Quality products for your beloved pets</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          <div className="flex gap-2 mt-4">
            {categories.map(category => (
              <button
                key={category}
                className={`px-4 py-2 rounded-lg text-sm ${
                  category === 'All'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition">
              <Link to={`/shop/${product.id}`}>
                <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
              </Link>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <Link to={`/shop/${product.id}`} className="flex-1">
                    <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                      {product.name}
                    </h3>
                  </Link>
                  <span className="text-sm text-gray-500">{product.category}</span>
                </div>

                <div className="flex items-center gap-1 mb-3">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium text-gray-900">{product.rating}</span>
                  <span className="text-sm text-gray-500">({product.reviews})</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-900">${product.price}</span>
                  {product.inStock ? (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Add
                    </button>
                  ) : (
                    <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
