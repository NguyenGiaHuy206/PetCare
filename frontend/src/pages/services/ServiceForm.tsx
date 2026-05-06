import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, Save, Upload, Image as ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { categoryAPI, type CategoryResponse } from "../../services/categories";
import { productAPI } from "../../services/products";
import { storageAPI } from "../../services/storage";
import { getApiErrorMessage } from "../../utils/errors";

export default function ServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { user } = useAuth();

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoryAPI.getAll("service");
        setCategories(data);
        if (!categoryId && data.length > 0) {
          setCategoryId(data[0].id);
        }
      } catch {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadService = async () => {
      if (!isEdit || !id) {
        return;
      }
      try {
        const service = await productAPI.getById(id);
        setName(service.name);
        setDescription(service.description ?? "");
        setPrice(String(service.price));
        setCategoryId(service.category_id ?? "");
        setImageUrl(service.image_url ?? "");
        setImagePreview(service.image_url ?? "");
        setDurationMinutes(service.duration_minutes ? String(service.duration_minutes) : "");
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load service"));
      }
    };

    loadService();
  }, [id, isEdit]);

  const uploadImage = async (file: File) => {
    const { upload_url, file_url } = await storageAPI.getPresignedUrl(file.name);
    await fetch(upload_url, { method: "PUT", body: file });
    const confirm = await storageAPI.confirmUpload(file_url);
    return confirm.file_url;
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : imageUrl);
  };

  const addCategory = async () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;

    try {
      setCategoryError("");
      const created = await categoryAPI.create({ name: trimmed, scope: "service" });
      setCategories((current) =>
        current.some((category) => category.id === created.id)
          ? current
          : [...current, created]
      );
      setCategoryId(created.id);
      setNewCategory("");
    } catch (err: any) {
      setCategoryError(err.response?.data?.detail || "Failed to add category.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      let finalImageUrl = imageUrl || undefined;
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const payload = {
        name,
        description,
        price: Number(price),
        stock: 9999,
        kind: "service" as const,
        category_id: categoryId || undefined,
        duration_minutes: durationMinutes ? Number(durationMinutes) : undefined,
        image_url: finalImageUrl,
      };
      if (isEdit && id) {
        await productAPI.update(id, payload);
      } else {
        await productAPI.create(payload);
      }
      navigate('/services');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to save service"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {user?.role !== "admin" ? (
        <div className="bg-white rounded-lg border p-6 text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin access required</h1>
          <p className="text-gray-600">Only admin users can add or edit services.</p>
          <Link to="/services" className="inline-flex px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to services
          </Link>
        </div>
      ) : (
        <>
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}
      <div className="flex items-center gap-4">
        <Link to="/services" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Service' : 'Add New Service'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Basic Grooming"
            />
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <div className="space-y-2">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {user?.role === 'admin' && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Add new category"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button type="button" onClick={addCategory} className="px-3 py-2 bg-blue-600 text-white rounded-lg whitespace-nowrap">Add</button>
                  </div>
                )}
              </div>
              {categoryError && (
                <p className="mt-2 text-sm text-red-600">{categoryError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time / Duration (minutes) <span className="text-gray-500">(optional)</span></label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="60"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Image</label>
            <div className="space-y-3">
              {imagePreview ? (
                <img src={imagePreview} alt="Service preview" className="w-full max-h-64 object-cover rounded-lg border" />
              ) : (
                <div className="w-full h-40 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-500">
                  <ImageIcon className="w-6 h-6 mr-2" />
                  No image selected
                </div>
              )}
              <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="w-4 h-4" />
                <span>{imageFile ? imageFile.name : "Add image"}</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="35.00"
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 flex items-center">Optional time is used as the booking duration display.</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Detailed description of the service..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : isEdit ? 'Save Changes' : 'Add Service'}
            </button>
            <Link
              to="/services"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
        </>
      )}
    </div>
  );
}
