"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "../../../../src/contexts/SupabaseContext";
import LoadingSpinner from "../../../../src/components/common/LoadingSpinner";

export default function NewReminderPage() {
  const { supabase } = useSupabase();
  const router = useRouter();

  const [patients, setPatients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    patient_id: "",
    scheduled_date: "",
    contact_method: "email",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(true);

  // 🧠 Load patients for dropdown
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/patients`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to load patients");

        const data = await res.json();
        setPatients(data.patients || data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPatients();
  }, [supabase]);

  // 📝 Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🚀 Submit form to backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("You must be logged in to create a reminder");
        setLoading(false);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/reminders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create reminder");
      }

      router.push("/reminders");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Schedule Reminder</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        {/* Patient Selection */}
        <div>
          <label className="label">Select Patient</label>
          {loadingPatients ? (
            <div className="text-sm text-gray-500">Loading patients...</div>
          ) : (
            <select
              name="patient_id"
              value={formData.patient_id}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="">-- Select a Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.email || p.phone || "No contact"})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Scheduled Date */}
        <div>
          <label className="label">Scheduled Date</label>
          <input
            type="datetime-local"
            name="scheduled_date"
            value={formData.scheduled_date}
            onChange={handleChange}
            required
            className="input-field"
          />
        </div>

        {/* Contact Method */}
        <div>
          <label className="label">Contact Method</label>
          <select
            name="contact_method"
            value={formData.contact_method}
            onChange={handleChange}
            className="input-field"
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>

        {/* Message */}
        <div>
          <label className="label">Message</label>
          <textarea
            name="message"
            rows={4}
            value={formData.message}
            onChange={handleChange}
            placeholder="Type your reminder message..."
            className="input-field"
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex justify-center items-center"
        >
          {loading ? <LoadingSpinner size="sm" /> : "Create Reminder"}
        </button>
      </form>
    </div>
  );
}
