import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, Save, Loader, ImagePlus, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { petAPI, storageAPI, PetResponse } from "../../utils/api";

export default function PetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    age: "",
    weight: 0,
    color: "",
    gender: "",
    microchip_id: "",
    notes: "",
    photo_url: "",
  });

  useEffect(() => {
    if (isEdit && id) {
      const loadPet = async () => {
        try {
          setLoading(true);
          const pet = await petAPI.getById(id);
          setFormData({
            name: pet.name,
            species: pet.species,
            breed: pet.breed,
            age: pet.age || "",
            weight: pet.weight || 0,
            color: pet.color || "",
            gender: pet.gender || "",
            microchip_id: pet.microchip_id || "",
            notes: pet.notes || "",
            photo_url: pet.photo_url || "",
          });
          if (pet.photo_url) setPhotoPreview(pet.photo_url);
        } catch (err: any) {
          setError(err.response?.data?.detail || "Failed to load pet");
        } finally {
          setLoading(false);
        }
      };
      loadPet();
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "weight" ? parseFloat(value) || 0 : value,
    }));
    setError("");
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    setPhotoPreview(URL.createObjectURL(file));
    setUploading(true);
    setError("");

    try {
      const { upload_url, file_url } = await storageAPI.getPresignedUrl(file.name);

      await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      await storageAPI.confirmUpload(file_url);

      setFormData((prev) => ({ ...prev, photo_url: file_url }));
    } catch (err: any) {
      setError("Failed to upload photo. Please try again.");
      setPhotoPreview(formData.photo_url); // revert to previous
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    setPhotoPreview("");
    setFormData((prev) => ({ ...prev, photo_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit && id) {
        await petAPI.update(id, formData);
      } else {
        await petAPI.create(formData);
      }
      navigate("/pets");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save pet");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/pets" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? "Edit Pet" : "Add New Pet"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 max-w-2xl">
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* ── Photo Upload ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pet Photo</label>
            {photoPreview ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                <img src={photoPreview} alt="Pet preview" className="w-full h-full object-cover" />
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
                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition"
              >
                <ImagePlus className="w-8 h-8" />
                <span className="text-sm font-medium">Click to upload photo</span>
                <span className="text-xs">JPG, PNG up to 10MB</span>
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

          {/* ── Name & Species ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pet Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Max"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Species *</label>
              <select
                name="species"
                required
                value={formData.species}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select species</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Rabbit">Rabbit</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* ── Breed & Age ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Breed *</label>
              <input
                type="text"
                name="breed"
                required
                value={formData.breed}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Golden Retriever"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="text"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="3 years"
              />
            </div>
          </div>

          {/* ── Weight & Color ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                name="weight"
                step="0.1"
                min="0"
                value={formData.weight}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="4.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Golden"
              />
            </div>
          </div>

          {/* ── Gender ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* ── Microchip ID ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Microchip ID</label>
            <input
              type="text"
              name="microchip_id"
              value={formData.microchip_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="123456789012345"
            />
          </div>

          {/* ── Notes ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional information about your pet..."
            />
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting || uploading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Pet"}
            </button>
            <Link
              to="/pets"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}