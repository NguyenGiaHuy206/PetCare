import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Plus, Edit, Trash2, Clock, Search } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { productAPI, type ProductResponse } from "../../services/products";
import { categoryAPI, type CategoryResponse } from "../../services/categories";
import { getApiErrorMessage } from "../../utils/errors";
import { formatVnd } from "../../utils/format";
import { getImageSrc } from "../../utils/images";

export default function ServiceList() {
  const { user } = useAuth();
  const [services, setServices] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const [products, categoryData] = await Promise.all([
          productAPI.getAll(0, 100, undefined, "service"),
          categoryAPI.getAll("service"),
        ]);
        setServices(products);
        setCategories(categoryData);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load services"));
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleDeleteService = async (id: string) => {
    if (!window.confirm("Delete this service?")) {
      return;
    }

    try {
      await productAPI.delete(id);
      setServices((current) => current.filter((service) => service.id !== id));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to delete service"));
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm("Delete this category?")) {
      return;
    }
    try {
      await categoryAPI.delete(categoryId);
      setCategories((current) => current.filter((category) => category.id !== categoryId));
      if (selectedCategory === categoryId) {
        setSelectedCategory("all");
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to delete category"));
    }
  };

  if (loading) return <div className="text-center py-10">Loading services...</div>;
  if (error) return <div className="text-red-600 py-10">{error}</div>;

  const normalizedSearch = serviceSearch.trim().toLowerCase();
  const filteredServices = services.filter((service) => {
    const categoryMatch = selectedCategory === "all" || service.category_id === selectedCategory;
    const searchMatch = !normalizedSearch || service.name.toLowerCase().includes(normalizedSearch);
    return categoryMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Services Management</h1>
          {user?.role === "admin" && (
            <Link to="/services/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Service
            </Link>
          )}
        </div>

        <div className="bg-white rounded-lg border p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Services</label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={serviceSearch}
              onChange={(event) => setServiceSearch(event.target.value)}
              placeholder="Search by service name"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter by Category */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-lg ${selectedCategory === "all" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              All
            </button>
            {categories.map((category) => (
              <div key={category.id} className="inline-flex items-center gap-1 bg-gray-100 rounded-lg pr-2">
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-l-lg ${selectedCategory === category.id ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-200"}`}
                >
                  {category.name}
                </button>
                {user?.role === "admin" && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Delete category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Services List */}
        <div className="space-y-4">
          {filteredServices.length > 0 ? (
            filteredServices.map(service => (
              <div key={service.id} className="bg-white rounded-lg border p-6 hover:shadow-md transition">
                <div className="flex flex-col lg:flex-row gap-5 lg:items-start">
                  <div className="w-full lg:w-40 flex-shrink-0">
                    {service.image_url ? (
                      <img src={getImageSrc(service.image_url)} alt={service.name} className="w-full h-32 rounded-lg object-cover border" />
                    ) : (
                      <div className="w-full h-32 rounded-lg bg-gray-100 border" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                      {service.category_id && (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                          {categories.find((category) => category.id === service.category_id)?.name ?? "Uncategorized"}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4">{service.description || "No description available"}</p>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{service.duration_minutes ? `${service.duration_minutes} min` : "Flexible time"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <span>{formatVnd(service.price)}</span>
                      </div>
                    </div>
                  </div>
                  {user?.role === "admin" && (
                    <div className="flex gap-2">
                      <Link to={`/services/${service.id}/edit`} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(service.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {user?.role !== "admin" && (
                    <Link
                      to={`/bookings/new?service=${encodeURIComponent(service.name)}`}
                      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Book service
                    </Link>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">No services found</div>
          )}
        </div>
      </div>
    </div>
  );
}
