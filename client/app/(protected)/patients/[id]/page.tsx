"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabase } from "../../../../src/contexts/SupabaseContext";
import LoadingSpinner from "../../../../src/components/common/LoadingSpinner";
import { ArrowLeft } from "lucide-react";

export default function PatientDetailsPage() {
  const { id } = useParams();
  const { supabase } = useSupabase();
  const router = useRouter();

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
          setError("You must be logged in to view patient details");
          setLoading(false);
          return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/patients/${id}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to load patient");
        }

        const data = await res.json();
        setPatient(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPatient();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 max-w-lg mx-auto mt-10">
        {error}
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12 text-gray-600">
        Patient not found.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/patients")}
        className="flex items-center text-sm text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Patients
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
        <p className="text-gray-600">Patient ID: {patient.id}</p>
      </div>

      {/* Info Card */}
      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <p className="text-gray-900">{patient.email || "N/A"}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Phone</label>
          <p className="text-gray-900">{patient.phone || "N/A"}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Date of Birth</label>
          <p className="text-gray-900">{patient.date_of_birth || "N/A"}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Last Visit</label>
          <p className="text-gray-900">{patient.last_visit_date || "N/A"}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Next Follow-Up</label>
          <p className="text-gray-900">{patient.next_follow_up_date || "N/A"}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Notes</label>
          <p className="text-gray-900 whitespace-pre-line">{patient.notes || "No notes available"}</p>
        </div>
      </div>
    </div>
  );
}
