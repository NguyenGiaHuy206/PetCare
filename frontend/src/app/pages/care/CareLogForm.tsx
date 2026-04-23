import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Save, Upload, Loader2 } from "lucide-react";
import { careLogAPI, petAPI, PetResponse, storageAPI } from "../../utils/api";

const activities = [
  "feeding",
  "grooming",
  "walking",
  "medication",
  "training",
  "health",
  "other",
];

export default function CareLogForm() {
  const navigate = useNavigate();
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [petId, setPetId] = useState("");
  const [activity, setActivity] = useState("feeding");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(new Date().toISOString().slice(11, 16));
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPets = async () => {
      try {
        const data = await petAPI.getAll();
        setPets(data);
        if (data.length > 0) {
          setPetId(data[0].id);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load pets.");
      } finally {
        setLoading(false);
      }
    };

    loadPets();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  };

  const uploadImage = async (file: File) => {
    const { upload_url, file_url } = await storageAPI.getPresignedUrl(file.name);
    await fetch(upload_url, { method: "PUT", body: file });
    const confirm = await storageAPI.confirmUpload(file_url);
    return confirm.file_url;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!petId || !activity || !date || !time) {
      setError("Please complete the required fields.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const timestamp = new Date(`${date}T${time}:00`).toISOString();

      await careLogAPI.create({
        pet_id: petId,
        activity,
        timestamp,
        notes,
        image_url: imageUrl,
      });

      navigate("/care-logs");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save care log.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/care-logs" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Care Log Entry</h1>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Pet *</label>
            <select
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name} ({pet.species})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {activities.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe what happened, observations, or any relevant details..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
            <div className="space-y-3">
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover rounded-lg border" />
              )}
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400">
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-sm text-gray-600">Upload a photo (optional)</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Entry"}
            </button>
            <Link
              to="/care-logs"
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
