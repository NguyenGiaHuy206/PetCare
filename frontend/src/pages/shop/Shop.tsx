import { Link } from "react-router";
import { ShoppingCart, Search, Loader2, Plus, Trash2, Edit, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { productAPI, ProductResponse } from "../../services/products";
import { cartAPI } from "../../services/carts";
import { categoryAPI, type CategoryResponse } from "../../services/categories";
import { useAuth } from "../../contexts/AuthContext";
import { storageAPI } from "../../services/storage";
import { getApiErrorMessage } from "../../utils/errors";
import { useToast } from "../../components/ToastProvider";
import { formatVnd } from "../../utils/format";
import { getImageSrc } from "../../utils/images";

export default function Shop() {
  const { user } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProductResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("0");
  const [formWeight, setFormWeight] = useState("0");
  const [formLength, setFormLength] = useState("0");
  const [formWidth, setFormWidth] = useState("0");
  const [formHeight, setFormHeight] = useState("0");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoryAPI.getAll("shop");
        setCategories(data);
        if (data.length > 0) {
          setFormCategoryId(data[0].id);
        }
      } catch {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await productAPI.getAll(0, 50, undefined, "shop");
        setProducts(data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load products. Please try again."));
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    const categoryMatch = category === "all" || product.category_id === category;
    const searchMatch =
      !normalizedSearch ||
      product.name.toLowerCase().includes(normalizedSearch) ||
      (product.description ?? "").toLowerCase().includes(normalizedSearch);
    return categoryMatch && searchMatch;
  });
  const recommendedProducts = products.filter((product) => !filteredProducts.some((item) => item.id === product.id)).slice(0, 4);

  const uploadImage = async (file: File) => {
    return storageAPI.uploadImage(file);
  };

  const resetForm = () => {
    setEditing(null);
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormStock("0");
    setFormWeight("0");
    setFormLength("0");
    setFormWidth("0");
    setFormHeight("0");
    setImageFile(null);
    setImagePreview("");
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (product: ProductResponse) => {
    setEditing(product);
    setFormName(product.name);
    setFormDescription(product.description ?? "");
    setFormPrice(String(product.price));
    setFormStock(String(product.stock));
    setFormWeight(String(product.package_weight_gram ?? 0));
    setFormLength(String(product.package_length_cm ?? 0));
    setFormWidth(String(product.package_width_cm ?? 0));
    setFormHeight(String(product.package_height_cm ?? 0));
    setFormCategoryId(product.category_id ?? "");
    setImagePreview(product.image_url ?? "");
    setShowForm(true);
  };

  const handleSaveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (Number(formStock) < 0) {
        setError("Stock cannot be negative.");
        return;
      }
      let image_url = editing?.image_url;
      if (imageFile) {
        image_url = await uploadImage(imageFile);
      }

      const payload = {
        name: formName,
        description: formDescription,
        price: Number(formPrice),
        stock: Number(formStock),
        kind: "shop" as const,
        category_id: formCategoryId || undefined,
        image_url,
        package_weight_gram: Number(formWeight),
        package_length_cm: Number(formLength),
        package_width_cm: Number(formWidth),
        package_height_cm: Number(formHeight),
      };

      if (editing) {
        const updated = await productAPI.update(editing.id, payload);
        setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await productAPI.create(payload);
        setProducts((current) => [created, ...current]);
      }

      setShowForm(false);
      resetForm();
      toast.success(editing ? "Product updated." : "Product created.");
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, "Failed to save product.");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product?")) {
      return;
    }
    try {
      await productAPI.delete(id);
      setProducts((current) => current.filter((item) => item.id !== id));
      toast.success("Product deleted.");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to delete product."));
    }
  };

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) {
      return;
    }
    try {
      const created = await categoryAPI.create({ name, scope: "shop" });
      setCategories((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategory("");
      setFormCategoryId(created.id);
      toast.success("Category added.");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to add category."));
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm("Delete this category?")) {
      return;
    }
    try {
      await categoryAPI.delete(categoryId);
      setCategories((current) => current.filter((cat) => cat.id !== categoryId));
      if (category === categoryId) {
        setCategory("all");
      }
      toast.success("Category deleted.");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to delete category."));
    }
  };

  const handleAddToCart = async (product: ProductResponse) => {
    if (!user) {
      toast.info("Please register or sign in before adding products to cart.");
      return;
    }
    try {
      setAddingToCart(product.id);
      await cartAPI.addToCart(product.id, 1);
      window.dispatchEvent(new Event("cart-updated"));
      toast.success("Added to cart.");
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, "Failed to add item to cart. Please try again.");
      setError(message);
      toast.error(message);
    } finally {
      setAddingToCart(null);
    }
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
        <div className="mb-8 flex justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pet Shop</h1>
            <p className="text-gray-600">Find everything your pet needs</p>
          </div>
          {user?.role === "admin" && (
            <button
              type="button"
              onClick={openCreateForm}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          )}
        </div>

        {user?.role === "admin" && (
          <div className="bg-white rounded-lg border p-4 mb-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">Shop Categories</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Add category"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <button type="button" onClick={handleAddCategory} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full hover:bg-red-100"
                >
                  <Trash2 className="w-3 h-3" />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {user?.role === "admin" && showForm && (
          <form onSubmit={handleSaveProduct} className="bg-white rounded-lg border p-6 mb-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">{editing ? "Edit Product" : "Add Product"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1 text-sm font-medium text-gray-700">
                <span>Product name</span>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} required placeholder="Product name" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </label>
              <label className="space-y-1 text-sm font-medium text-gray-700">
                <span>Category</span>
                <select value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm font-medium text-gray-700">
                <span>Price (VND)</span>
                <input value={formPrice} onChange={(e) => setFormPrice(e.target.value)} required type="number" min="0" step="1000" placeholder="Price" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </label>
              <label className="space-y-1 text-sm font-medium text-gray-700">
                <span>Stock</span>
                <input value={formStock} onChange={(e) => setFormStock(e.target.value)} required type="number" min="0" placeholder="Stock" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </label>
              <label className="space-y-1 text-sm font-medium text-gray-700">
                <span>Package weight (gram)</span>
                <input value={formWeight} onChange={(e) => setFormWeight(e.target.value)} required type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </label>
              <label className="space-y-1 text-sm font-medium text-gray-700">
                <span>Length (cm)</span>
                <input value={formLength} onChange={(e) => setFormLength(e.target.value)} required type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </label>
              <label className="space-y-1 text-sm font-medium text-gray-700">
                <span>Width (cm)</span>
                <input value={formWidth} onChange={(e) => setFormWidth(e.target.value)} required type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </label>
              <label className="space-y-1 text-sm font-medium text-gray-700">
                <span>Height (cm)</span>
                <input value={formHeight} onChange={(e) => setFormHeight(e.target.value)} required type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </label>
            </div>
            <label className="space-y-1 text-sm font-medium text-gray-700 block">
              <span>Description</span>
              <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3} placeholder="Description" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </label>
            <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <Upload className="w-4 h-4" />
              <span>{imageFile ? imageFile.name : "Upload image"}</span>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setImageFile(file);
                setImagePreview(file ? URL.createObjectURL(file) : editing?.image_url ?? "");
              }} />
            </label>
            {imagePreview && <img src={getImageSrc(imagePreview)} alt="Product preview" className="h-40 w-40 rounded-lg border object-cover" />}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {saving ? "Saving..." : editing ? "Update Product" : "Create Product"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </form>
        )}

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
                <option value="all">All</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition"
            >
              <Link to={`/shop/${product.id}`}>
                {product.image_url ? (
                  <img
                    src={getImageSrc(product.image_url)}
                    alt={product.name}
                    className="w-full h-48 object-cover hover:opacity-90 transition"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100" aria-hidden="true" />
                )}
              </Link>
              <div className="p-4">
                <Link to={`/shop/${product.id}`}>
                  <h3 className="font-semibold text-gray-900 mb-1 hover:text-blue-600 transition">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description || "No description available"}</p>
                <p className="text-xs text-gray-500 mb-2">
                  {categories.find((cat) => cat.id === product.category_id)?.name ?? "Uncategorized"}
                </p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-gray-900">{formatVnd(product.price)}</span>
                  <span className="text-xs text-gray-500">{product.stock} in stock</span>
                </div>
                <div className="flex gap-2">
                  <Link to={`/shop/${product.id}`} className={`${user?.role === "admin" ? "w-full" : "flex-1"} text-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition`}>
                    View Details
                  </Link>
                  {user?.role !== "admin" && (
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0 || addingToCart === product.id}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                    >
                      {addingToCart === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                {user?.role === "admin" && (
                  <div className="flex gap-2 mt-2">
                    <button type="button" onClick={() => openEditForm(product)} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center gap-1">
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDeleteProduct(product.id)} className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 inline-flex items-center gap-1">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
                {product.stock === 0 && <p className="text-sm text-red-600 mt-2">Out of stock</p>}
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

        {recommendedProducts.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Recommended for you</h2>
                <p className="text-sm text-gray-600">A few more products worth checking out.</p>
              </div>
              <Link to="/shop" className="text-sm font-medium text-blue-600 hover:text-blue-700">Browse all</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedProducts.map((product) => (
                <Link key={product.id} to={`/shop/${product.id}`} className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition block">
                  {product.image_url ? (
                    <img src={getImageSrc(product.image_url)} alt={product.name} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-gray-100" aria-hidden="true" />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description || "No description available"}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{formatVnd(product.price)}</span>
                      <span className="text-xs text-gray-500">{product.stock} left</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
