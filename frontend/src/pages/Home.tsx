import { useEffect, useState } from "react";
import { Link } from "react-router";
import { PawPrint, Calendar, ShoppingBag, Star, ArrowRight } from "lucide-react";
import { productAPI, type ProductResponse } from "../services/products";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [featuredServices, setFeaturedServices] = useState<ProductResponse[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [services, products] = await Promise.all([
          productAPI.getAll(0, 4, undefined, "service"),
          productAPI.getAll(0, 4, undefined, "shop"),
        ]);
        setFeaturedServices(services);
        setFeaturedProducts(products);
      } catch (err) {
        console.error("Failed to load home catalog:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const features = [
    { icon: PawPrint, title: "Pet Profiles", description: "Manage all your pets in one place" },
    { icon: Calendar, title: "Easy Booking", description: "Schedule services with just a few clicks" },
    { icon: ShoppingBag, title: "Pet Shop", description: "Quality products for your furry friends" },
    { icon: Star, title: "Expert Care", description: "Professional services from certified specialists" },
  ];

  const renderCardImage = (imageUrl?: string) => (
    imageUrl ? (
      <img src={imageUrl} alt="" className="w-full h-48 object-cover" />
    ) : (
      <div className="h-48 bg-gray-100" aria-hidden="true" />
    )
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Everything Your Pet Needs<br />in One Place
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Professional pet care services, premium products, and expert advice for your beloved companions
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/services" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                Book a Service
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/shop" className="px-6 py-3 bg-white text-blue-600 rounded-lg border border-blue-600 hover:bg-blue-50">
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Services</h2>
              <p className="text-gray-600">Professional care from experienced specialists</p>
            </div>
            <Link to="/services" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              Browse Services
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredServices.map((service) => (
              <div key={service.id} className="bg-white rounded-lg overflow-hidden border hover:shadow-lg transition">
                {renderCardImage(service.image_url ?? undefined)}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
                  <p className="text-blue-600 mb-3">${service.price.toFixed(2)}</p>
                  <Link to="/bookings/new" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                    Book Now
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Products</h2>
              <p className="text-gray-600">Shop essentials for everyday pet care</p>
            </div>
            <Link to="/shop" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              Browse Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg overflow-hidden border hover:shadow-lg transition">
                {renderCardImage(product.image_url ?? undefined)}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-blue-600 mb-3">${product.price.toFixed(2)}</p>
                  <Link to="/shop" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                    View in Shop
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section (only for unauthenticated users) */}
      {!isAuthenticated && (
        <section className="py-16 bg-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 opacity-90">Join thousands of happy pet owners today</p>
            <Link to="/register" className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100">
              Create Free Account
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
