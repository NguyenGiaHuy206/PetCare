import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Save, Upload, Loader2 } from "lucide-react";
import { careLogAPI } from "../../services/careLogs";
import { petAPI, PetResponse } from "../../services/pets";
import { storageAPI } from "../../services/storage";
import { useAuth } from "../../contexts/AuthContext";
import { adminAPI } from "../../services/admin";
import { type UserResponse } from "../../services/users";
import { categoryAPI, CategoryResponse } from "../../services/categories";
import { getApiErrorMessage } from "../../utils/errors";
import { getImageSrc } from "../../utils/images";

export default function CareLogForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [careLogTypes, setCareLogTypes] = useState<CategoryResponse[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [petId, setPetId] = useState("");
  const [activity, setActivity] = useState("");
  const [customActivity, setCustomActivity] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(new Date().toISOString().slice(11, 16));
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (user?.role !== "admin") {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [usersData, typesData] = await Promise.all([
          adminAPI.getUsers(),
          categoryAPI.getAll("carelog"),
        ]);
        setUsers(usersData.filter((account) => account.role !== "admin"));
        setCareLogTypes(typesData);
        if (typesData.length > 0) {
          setActivity(typesData[0].name);
        }

        if (isEdit && id) {
          const log = await careLogAPI.getById(id);
          setSelectedUserId(log.user_id);
          const ownerPets = await petAPI.getAllAdmin(log.user_id);
          setPets(ownerPets);
          setPetId(log.pet_id);
          const hasType = typesData.some((type) => type.name === log.activity);
          setActivity(hasType ? log.activity : typesData[0]?.name ?? "");
          setCustomActivity(hasType ? "" : log.activity);
          const logDate = new Date(log.timestamp);
          setDate(logDate.toISOString().slice(0, 10));
          setTime(logDate.toISOString().slice(11, 16));
          setNotes(log.notes ?? "");
          setImagePreview(log.image_url ?? "");
        }
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load care log form."));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isEdit, user?.role]);

  useEffect(() => {
    const loadPetsByUser = async () => {
      if (!selectedUserId || isEdit || user?.role !== "admin") {
        return;
      }
      try {
        const ownerPets = await petAPI.getAllAdmin(selectedUserId);
        setPets(ownerPets);
        if (ownerPets.length > 0) {
          setPetId(ownerPets[0].id);
        }
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load user's pets."));
      }
    };

    loadPetsByUser();
  }, [selectedUserId, isEdit]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  };

  const uploadImage = async (file: File) => {
    return storageAPI.uploadImage(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const finalActivity = customActivity.trim() || activity;
    if (!selectedUserId || !petId || !finalActivity || !date || !time) {
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

      const payload: {
        user_id?: string;
        pet_id: string;
        activity: string;
        timestamp: string;
        notes?: string;
        image_url?: string;
      } = {
        pet_id: petId,
        activity: finalActivity,
        timestamp,
        notes,
        image_url: imageUrl,
      };

      if (selectedUserId) {
        payload.user_id = selectedUserId;
      }

      if (isEdit && id) {
        await careLogAPI.update(id, payload);
      } else {
        await careLogAPI.create(payload);
      }

      navigate("/care-logs");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to save care log."));
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
      {user?.role !== "admin" ? (
        <div className="bg-white rounded-lg border p-6 text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin access required</h1>
          <p className="text-gray-600">Only admin users can add care log entries.</p>
          <Link to="/care-logs" className="inline-flex px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to care logs
          </Link>
        </div>
      ) : (
        <>
      <div className="flex items-center gap-4">
        <Link to="/care-logs" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? "Edit Care Log Entry" : "Add Care Log Entry"}</h1>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select User *</label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setPetId("");
              }}
              required
              disabled={isEdit}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a user</option>
              {users.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.full_name} ({account.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Pet *</label>
            <select
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              required
              disabled={!selectedUserId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a pet</option>
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
              required={!customActivity.trim()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {careLogTypes.length === 0 && <option value="">No types available</option>}
              {careLogTypes.map((type) => (
                <option key={type.id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adding type (optional)</label>
            <input
              type="text"
              value={customActivity}
              onChange={(e) => setCustomActivity(e.target.value)}
              placeholder="e.g. Bathing, Nail Trim"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">When filled, this overrides the selected type.</p>
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
                <img src={getImageSrc(imagePreview)} alt="Preview" className="w-full max-h-64 object-cover rounded-lg border" />
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
              {saving ? "Saving..." : isEdit ? "Update Entry" : "Save Entry"}
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
        </>
      )}
    </div>
  );
}
