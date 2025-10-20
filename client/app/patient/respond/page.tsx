"use client";
import { Suspense } from "react";
import PatientPortal from "../../../src/components/patientPortal/PatientPortal";

export default function PatientRespondPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientPortal />
    </Suspense>
  );
}
