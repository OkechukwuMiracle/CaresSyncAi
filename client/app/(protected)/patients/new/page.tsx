"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "../../../../src/contexts/SupabaseContext";
import LoadingSpinner from "../../../../src/components/common/LoadingSpinner";

export default function NewPatientPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("You must be logged in to add a patient");
        setLoading(false);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create patient");
      }

      router.push("/patients");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Add New Patient</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="label">Name</label>
          <input name="name" value={formData.name} onChange={handleChange} required className="input-field" />
        </div>

        <div>
          <label className="label">Email</label>
          <input name="email" type="email" value={formData.email} onChange={handleChange} className="input-field" />
        </div>

        <div>
          <label className="label">Phone</label>
          <input name="phone" value={formData.phone} onChange={handleChange} className="input-field" />
        </div>

        <div>
          <label className="label">Date of Birth</label>
          <input name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} className="input-field" />
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea name="notes" rows={4} value={formData.notes} onChange={handleChange} className="input-field" />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center"
        >
          {loading ? <LoadingSpinner size="sm" /> : "Save Patient"}
        </button>
      </form>
    </div>
  );
}
