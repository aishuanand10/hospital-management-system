"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/providers/AuthProvider";
import { ApiError } from "@/lib/api/client";
import { listDoctors } from "@/lib/api/doctors";
import { listPatients } from "@/lib/api/patients";
import {
  createAllergy,
  createMedicalRecord,
  deleteMedicalRecord,
  getPatientTimeline,
} from "@/lib/api/medicalRecords";
import { canWrite } from "@/lib/auth/rbac";
import type { Doctor } from "@/types/doctor";
import type { Patient } from "@/types/patient";
import {
  ALLERGY_SEVERITY_OPTIONS,
  VISIT_TYPE_OPTIONS,
  formatVisitType,
  type PatientTimeline,
  type Prescription,
  type VisitType,
} from "@/types/medicalRecord";

const EMPTY_RECORD = {
  doctor: "" as string,
  visit_type: "consultation" as VisitType,
  symptoms: "",
  diagnosis: "",
  treatment: "",
  notes: "",
};

const EMPTY_ALLERGY = {
  allergen: "",
  reaction: "",
  severity: "mild" as (typeof ALLERGY_SEVERITY_OPTIONS)[number]["value"],
  notes: "",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function MedicalRecordsPage() {
  const { user } = useAuth();
  const editable = canWrite("medical_records", user?.role);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [timeline, setTimeline] = useState<PatientTimeline | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showRecordForm, setShowRecordForm] = useState(false);
  const [recordForm, setRecordForm] = useState(EMPTY_RECORD);
  const [prescriptions, setPrescriptions] = useState<Partial<Prescription>[]>([]);
  const [showAllergyForm, setShowAllergyForm] = useState(false);
  const [allergyForm, setAllergyForm] = useState(EMPTY_ALLERGY);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listPatients()
      .then((data) => {
        setPatients(data.results);
        if (data.results.length > 0) setSelected(data.results[0].id);
      })
      .catch(() => undefined);
    listDoctors()
      .then((data) => setDoctors(data.results))
      .catch(() => undefined);
  }, []);

  const loadTimeline = useCallback(async () => {
    if (!selected) {
      setTimeline(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await getPatientTimeline(selected);
      setTimeline(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load timeline.");
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const addPrescriptionRow = () =>
    setPrescriptions([...prescriptions, { medication: "", dosage: "", frequency: "", duration: "" }]);

  const updatePrescription = (i: number, key: keyof Prescription, value: string) => {
    const next = [...prescriptions];
    next[i] = { ...next[i], [key]: value };
    setPrescriptions(next);
  };

  const submitRecord = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createMedicalRecord({
        patient: selected,
        doctor: recordForm.doctor || null,
        visit_type: recordForm.visit_type,
        symptoms: recordForm.symptoms,
        diagnosis: recordForm.diagnosis,
        treatment: recordForm.treatment,
        notes: recordForm.notes,
        prescriptions: prescriptions.filter((p) => p.medication),
      });
      setShowRecordForm(false);
      setRecordForm(EMPTY_RECORD);
      setPrescriptions([]);
      await loadTimeline();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save record.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitAllergy = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createAllergy({ patient: selected, ...allergyForm });
      setShowAllergyForm(false);
      setAllergyForm(EMPTY_ALLERGY);
      await loadTimeline();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save allergy.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Delete this medical record?")) return;
    try {
      await deleteMedicalRecord(id);
      await loadTimeline();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete record.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Medical Records</h1>
        <p className="text-slate-600">Patient medical history timeline</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Select a patient...</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.first_name} {p.last_name} ({p.medical_record_number})
            </option>
          ))}
        </select>
        {selected && editable && (
          <>
            <button
              onClick={() => setShowRecordForm((v) => !v)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add Record
            </button>
            <button
              onClick={() => setShowAllergyForm((v) => !v)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Add Allergy
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showRecordForm && editable && (
        <form onSubmit={submitRecord} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">New Medical Record</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <select value={recordForm.doctor}
              onChange={(e) => setRecordForm({ ...recordForm, doctor: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Attending doctor...</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.full_name}</option>
              ))}
            </select>
            <select value={recordForm.visit_type}
              onChange={(e) => setRecordForm({ ...recordForm, visit_type: e.target.value as VisitType })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {VISIT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <textarea placeholder="Symptoms" value={recordForm.symptoms}
              onChange={(e) => setRecordForm({ ...recordForm, symptoms: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={2} />
            <textarea placeholder="Diagnosis" value={recordForm.diagnosis}
              onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={2} />
            <textarea placeholder="Treatment" value={recordForm.treatment}
              onChange={(e) => setRecordForm({ ...recordForm, treatment: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={2} />
            <textarea placeholder="Notes" value={recordForm.notes}
              onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={2} />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Prescriptions</h3>
              <button type="button" onClick={addPrescriptionRow} className="text-sm text-blue-600 hover:underline">
                + Add prescription
              </button>
            </div>
            {prescriptions.map((p, i) => (
              <div key={i} className="mt-2 grid gap-2 sm:grid-cols-4">
                <input placeholder="Medication" value={p.medication ?? ""}
                  onChange={(e) => updatePrescription(i, "medication", e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input placeholder="Dosage" value={p.dosage ?? ""}
                  onChange={(e) => updatePrescription(i, "dosage", e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input placeholder="Frequency" value={p.frequency ?? ""}
                  onChange={(e) => updatePrescription(i, "frequency", e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input placeholder="Duration" value={p.duration ?? ""}
                  onChange={(e) => updatePrescription(i, "duration", e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {submitting ? "Saving..." : "Save Record"}
            </button>
            <button type="button" onClick={() => setShowRecordForm(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {showAllergyForm && editable && (
        <form onSubmit={submitAllergy} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">New Allergy</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input required placeholder="Allergen" value={allergyForm.allergen}
              onChange={(e) => setAllergyForm({ ...allergyForm, allergen: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input placeholder="Reaction" value={allergyForm.reaction}
              onChange={(e) => setAllergyForm({ ...allergyForm, reaction: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <select value={allergyForm.severity}
              onChange={(e) => setAllergyForm({ ...allergyForm, severity: e.target.value as typeof allergyForm.severity })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {ALLERGY_SEVERITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {submitting ? "Saving..." : "Save Allergy"}
            </button>
            <button type="button" onClick={() => setShowAllergyForm(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-slate-500">Loading timeline...</p>
      ) : !timeline ? (
        <p className="text-slate-500">Select a patient to view their medical history.</p>
      ) : (
        <div className="space-y-6">
          {timeline.allergies.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-sm font-semibold text-amber-800">Known Allergies</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {timeline.allergies.map((a) => (
                  <span key={a.id} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                    {a.allergen} - {a.severity}
                    {a.reaction ? ` (${a.reaction})` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>
            {timeline.records.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No medical records yet.</p>
            ) : (
              <ol className="mt-4 space-y-4 border-l-2 border-slate-200 pl-6">
                {timeline.records.map((r) => (
                  <li key={r.id} className="relative">
                    <span className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white bg-blue-600" />
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {formatVisitType(r.visit_type)}
                          </span>
                          <span className="ml-2 text-xs text-slate-500">{formatDate(r.record_date)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">{r.doctor_name ?? "Unassigned"}</span>
                          {editable && (
                            <button onClick={() => handleDeleteRecord(r.id)} className="text-xs text-red-600 hover:underline">
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                      <dl className="mt-3 space-y-2 text-sm">
                        {r.symptoms && (<div><dt className="font-medium text-slate-700">Symptoms</dt><dd className="text-slate-600">{r.symptoms}</dd></div>)}
                        {r.diagnosis && (<div><dt className="font-medium text-slate-700">Diagnosis</dt><dd className="text-slate-600">{r.diagnosis}</dd></div>)}
                        {r.treatment && (<div><dt className="font-medium text-slate-700">Treatment</dt><dd className="text-slate-600">{r.treatment}</dd></div>)}
                        {r.notes && (<div><dt className="font-medium text-slate-700">Notes</dt><dd className="text-slate-600">{r.notes}</dd></div>)}
                      </dl>
                      {r.prescriptions.length > 0 && (
                        <div className="mt-3 border-t border-slate-100 pt-3">
                          <p className="text-xs font-semibold uppercase text-slate-500">Prescriptions</p>
                          <ul className="mt-1 space-y-1 text-sm text-slate-600">
                            {r.prescriptions.map((p) => (
                              <li key={p.id}>
                                {p.medication}
                                {p.dosage ? ` - ${p.dosage}` : ""}
                                {p.frequency ? `, ${p.frequency}` : ""}
                                {p.duration ? ` for ${p.duration}` : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
