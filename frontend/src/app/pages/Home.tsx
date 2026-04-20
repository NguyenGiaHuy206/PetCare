import { Link } from "react-router";
import { PawPrint, Calendar, ShoppingBag, Star, ArrowRight } from "lucide-react";

export default function Home() {
  const features = [
    { icon: PawPrint, title: "Pet Profiles", description: "Manage all your pets in one place" },
    { icon: Calendar, title: "Easy Booking", description: "Schedule services with just a few clicks" },
    { icon: ShoppingBag, title: "Pet Shop", description: "Quality products for your furry friends" },
    { icon: Star, title: "Expert Care", description: "Professional services from certified specialists" },
  ];

  const services = [
    { name: "Grooming", price: "From $35", image: "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400" },
    { name: "Veterinary Care", price: "From $50", image: "https://images.unsplash.com/photo-1628407241799-88f0e14dde31?w=400" },
    { name: "Pet Training", price: "From $40", image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400" },
    { name: "Daycare", price: "From $25/day", image: "https://images.unsplash.com/photo-1522276498395-f4f68f7f8454?w=400" },
  ];

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
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-gray-600">Professional care from experienced specialists</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden border hover:shadow-lg transition">
                <img src={service.image} alt={service.name} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
                  <p className="text-blue-600 mb-3">{service.price}</p>
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

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of happy pet owners today</p>
          <Link to="/register" className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100">
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}
