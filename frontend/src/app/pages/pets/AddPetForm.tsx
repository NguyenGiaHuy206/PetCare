import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Save, X, Upload, Loader, ImagePlus } from "lucide-react";
import { petAPI, storageAPI } from "../../utils/api";

export default function AddPetForm() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    species: "Dog",
    breed: "",
    age: "",
    weight: "",
    color: "",
    gender: "",
    microchip_id: "",
    notes: "",
    photo_url: "",
  });

  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Upload photo via presigned URL
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPhotoPreview(localUrl);
    setUploading(true);
    setError("");

    try {
      // 1. Get presigned URL from backend
      const { upload_url, file_url } = await storageAPI.getPresignedUrl(file.name);

      // 2. Upload directly to S3
      await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      // 3. Confirm upload with backend
      await storageAPI.confirmUpload(file_url);

      // 4. Save the final URL to form
      setForm((prev) => ({ ...prev, photo_url: file_url }));
    } catch (err: any) {
      setError("Failed to upload photo. Please try again.");
      setPhotoPreview("");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    setPhotoPreview("");
    setForm((prev) => ({ ...prev, photo_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.species || !form.breed) {
      setError("Name, species, and breed are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await petAPI.create({
        name: form.name,
        species: form.species,
        breed: form.breed,
        age: form.age || undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        color: form.color || undefined,
        gender: form.gender || undefined,
        microchip_id: form.microchip_id || undefined,
        notes: form.notes || undefined,
        photo_url: form.photo_url || undefined,
      });
      navigate("/pets");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save pet");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/pets")}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Add New Pet</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pet Photo</label>
          {photoPreview ? (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border">
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
              {!uploading && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition"
            >
              <ImagePlus className="w-8 h-8" />
              <span className="text-sm">Click to upload photo</span>
              <span className="text-xs text-gray-400">JPG, PNG up to 10MB</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        {/* Name & Species */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pet Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Max"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Species <span className="text-red-500">*</span>
            </label>
            <select
              name="species"
              value={form.species}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Dog</option>
              <option>Cat</option>
              <option>Bird</option>
              <option>Rabbit</option>
              <option>Fish</option>
              <option>Hamster</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        {/* Breed & Age */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Breed <span className="text-red-500">*</span>
            </label>
            <input
              name="breed"
              value={form.breed}
              onChange={handleChange}
              placeholder="e.g. Golden Retriever"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              name="age"
              value={form.age}
              onChange={handleChange}
              placeholder="e.g. 3 years"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Weight & Color */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input
              name="weight"
              type="number"
              step="0.1"
              min="0"
              value={form.weight}
              onChange={handleChange}
              placeholder="e.g. 4.5"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <input
              name="color"
              value={form.color}
              onChange={handleChange}
              placeholder="e.g. Golden"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        {/* Microchip ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Microchip ID</label>
          <input
            name="microchip_id"
            value={form.microchip_id}
            onChange={handleChange}
            placeholder="123456789012345"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Any additional information about your pet..."
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Add Pet"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/pets")}
            className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}