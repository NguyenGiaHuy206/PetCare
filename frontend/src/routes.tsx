import { createBrowserRouter, Route } from "react-router";
import Layout from "./layouts/Layout";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Profile from "./pages/profile/Profile";
import PetList from "./pages/pets/PetList";
import PetDetail from "./pages/pets/PetDetail";
import PetForm from "./pages/pets/PetForm";
import ServiceList from "./pages/services/ServiceList";
import ServiceForm from "./pages/services/ServiceForm";
import BookingCalendar from "./pages/bookings/BookingCalendar";
import BookingForm from "./pages/bookings/BookingForm";
import CareLogs from "./pages/care/CareLogs";
import CareLogForm from "./pages/care/CareLogForm";
import Shop from "./pages/shop/Shop";
import ProductDetail from "./pages/shop/ProductDetail";
import Cart from "./pages/cart/Cart";
import Checkout from "./pages/cart/Checkout";
import Orders from "./pages/orders/Orders";
import OrderDetail from "./pages/orders/OrderDetail";
import PaymentStatus from "./pages/payment/PaymentStatus";
import Reports from "./pages/reports/Reports";
import AdminUsers from "./pages/admin/Users";
import Notifications from "./pages/notifications/Notifications";
import NotFound from "./pages/NotFound";
import AddPetForm from "./pages/pets/AddPetForm";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      { path: "forgot-password", Component: ForgotPassword },
      { path: "reset-password/:token", Component: ResetPassword },
      { path: "profile", Component: Profile },
      { path: "pets", Component: PetList },
      { path: "pets/new", Component: AddPetForm },
      { path: "pets/:id", Component: PetDetail },
      { path: "pets/:id/edit", Component: PetForm },
      { path: "services", Component: ServiceList },
      { path: "services/new", Component: ServiceForm },
      { path: "services/:id/edit", Component: ServiceForm },
      { path: "bookings", Component: BookingCalendar },
      { path: "bookings/new", Component: BookingForm },
      { path: "bookings/:id/edit", Component: BookingForm },
      { path: "care-logs", Component: CareLogs },
      { path: "care-logs/new", Component: CareLogForm },
      { path: "care-logs/:id/edit", Component: CareLogForm },
      { path: "shop", Component: Shop },
      { path: "shop/:id", Component: ProductDetail },
      { path: "cart", Component: Cart },
      { path: "checkout", Component: Checkout },
      { path: "orders", Component: Orders },
      { path: "orders/:id", Component: OrderDetail },
      { path: "payment/:status", Component: PaymentStatus },
      { path: "reports", Component: Reports },
      { path: "admin/users", Component: AdminUsers },
      { path: "notifications", Component: Notifications },
      { path: "*", Component: NotFound },
    ],
  },
]);
