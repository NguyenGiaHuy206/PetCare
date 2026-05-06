import { Outlet, Link, useLocation } from "react-router";
import { useNavigate } from "react-router";
import { Home, ShoppingBag, Calendar, FileText, Package, ShoppingCart, Receipt, BarChart3, Bell, User, PawPrint, Scissors, LogOut, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { cartAPI } from "../services/carts";

export default function Layout() {
  const location = useLocation();
    const navigate = useNavigate();
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const [userRole, setUserRole] = useState("customer");
  const [cartCount, setCartCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));

  useEffect(() => {
    setUserRole(user?.role ?? 'customer');
  }, [user]);

  useEffect(() => {
    const loadCartCount = async () => {
      try {
        if (isAuthenticated) {
          // prefer server-side cart when logged in
          const cart = await cartAPI.getCart();
          setCartCount(Array.isArray(cart.items) ? cart.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0) : 0);
        } else {
          const cart = JSON.parse(localStorage.getItem('petty_cart') || '[]');
          setCartCount(Array.isArray(cart) ? cart.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0) : 0);
        }
      } catch {
        setCartCount(0);
      }
    };

    const onCartUpdated = () => loadCartCount();
    loadCartCount();
    window.addEventListener('cart-updated', onCartUpdated);
    return () => window.removeEventListener('cart-updated', onCartUpdated);
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <PawPrint className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-semibold text-gray-900">Petty</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isActive('/') && !location.pathname.includes('/') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <Link to="/shop" className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isActive('/shop') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                <ShoppingBag className="w-4 h-4" />
                <span>Shop</span>
              </Link>
              <Link to="/services" className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isActive('/services') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                <Scissors className="w-4 h-4" />
                <span>Services</span>
              </Link>
              {isAuthenticated && (
                <>
                  <Link to="/pets" className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isActive('/pets') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                    <PawPrint className="w-4 h-4" />
                    <span>{userRole === 'admin' ? 'Users & Pets' : 'My Pets'}</span>
                  </Link>
                  <Link to="/bookings" className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isActive('/bookings') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                    <Calendar className="w-4 h-4" />
                    <span>{userRole === 'admin' ? 'Users\' Bookings' : 'Bookings'}</span>
                  </Link>
                </>
              )}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link to="/cart" className="relative p-2 text-gray-600 hover:text-gray-900">
                    <ShoppingCart className="w-6 h-6" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/notifications" className="relative p-2 text-gray-600 hover:text-gray-900">
                    <Bell className="w-6 h-6" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {notificationCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                    <User className="w-5 h-5" />
                    <span className="hidden sm:inline">{user?.full_name || 'Profile'}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-2 text-gray-600 hover:text-gray-900">
                    Login
                  </Link>
                  <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {isAuthenticated && !isPublicRoute && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex gap-6">
              {/* Sidebar */}
              <aside className="hidden lg:block w-64 flex-shrink-0">
                <div className="bg-white rounded-lg border p-4 sticky top-24">
                  <nav className="space-y-1">
                    <Link to="/pets" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive('/pets') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <PawPrint className="w-5 h-5" />
                      <span>{userRole === 'admin' ? 'Users & Pets' : 'My Pets'}</span>
                    </Link>
                    <Link to="/bookings" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive('/bookings') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <Calendar className="w-5 h-5" />
                      <span>{userRole === 'admin' ? 'Users\' Bookings' : 'Bookings'}</span>
                    </Link>
                    <Link to="/care-logs" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive('/care-logs') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <FileText className="w-5 h-5" />
                      <span>Care Logs</span>
                    </Link>
                    <Link to="/orders" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive('/orders') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <Receipt className="w-5 h-5" />
                      <span>{userRole === 'admin' ? 'Users\' Orders' : 'Orders'}</span>
                    </Link>
                    {userRole === 'admin' && (
                      <>
                        <Link to="/services" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive('/services') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                          <Package className="w-5 h-5" />
                          <span>Manage Services</span>
                        </Link>
                        <Link to="/admin/users" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive('/admin/users') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                          <Users className="w-5 h-5" />
                          <span>Manage Users</span>
                        </Link>
                        <Link to="/reports" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive('/reports') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                          <BarChart3 className="w-5 h-5" />
                          <span>Reports</span>
                        </Link>
                      </>
                    )}
                  </nav>
                </div>
              </aside>

              {/* Page content */}
              <div className="flex-1">
                <Outlet />
              </div>
            </div>
          </div>
        )}

        {(!isAuthenticated || isPublicRoute) && (
          <Outlet />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <PawPrint className="w-6 h-6 text-blue-600" />
                <span className="font-semibold text-gray-900">PetCare Shop</span>
              </div>
              <p className="text-sm text-gray-600">Your trusted partner in pet care and wellness.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Shop</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/shop" className="hover:text-gray-900">All Products</Link></li>
                <li><Link to="/shop" className="hover:text-gray-900">Browse Categories</Link></li>
                <li><Link to="/cart" className="hover:text-gray-900">View Cart</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Services</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/services" className="hover:text-gray-900">All Services</Link></li>
                <li><Link to="/services/new" className="hover:text-gray-900">Book a Service</Link></li>
                <li><Link to="/bookings" className="hover:text-gray-900">My Bookings</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Support</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Contact Us</a></li>
                <li><a href="#" className="hover:text-gray-900">FAQ</a></li>
                <li><a href="#" className="hover:text-gray-900">Shipping Info</a></li>
                <li><a href="#" className="hover:text-gray-900">Returns</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
            <p>&copy; 2026 PetCare Shop. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
