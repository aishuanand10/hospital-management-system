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
import { PageHeader, Alert } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { IconPlus, IconRecords, IconTrash } from "@/components/ui/icons";

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

const SEVERITY_TONES: Record<string, BadgeTone> = {
  mild: "gray",
  moderate: "amber",
  severe: "red",
  critical: "red",
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

  const removePrescriptionRow = (i: number) =>
    setPrescriptions(prescriptions.filter((_, idx) => idx !== i));

  const openRecordForm = () => {
    setRecordForm(EMPTY_RECORD);
    setPrescriptions([]);
    setError("");
    setShowRecordForm(true);
  };

  const openAllergyForm = () => {
    setAllergyForm(EMPTY_ALLERGY);
    setError("");
    setShowAllergyForm(true);
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
      <PageHeader title="Medical Records" subtitle="Patient medical history timeline">
        {selected && editable && (
          <>
            <Button variant="secondary" onClick={openAllergyForm}>
              Add Allergy
            </Button>
            <Button onClick={openRecordForm} icon={<IconPlus className="h-4 w-4" />}>
              Add Record
            </Button>
          </>
        )}
      </PageHeader>

      <div className="max-w-sm">
        <Field label="Patient">
          <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Select a patient...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name} ({p.medical_record_number})
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="inline-flex items-center gap-2 text-slate-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
            Loading timeline...
          </span>
        </div>
      ) : !timeline ? (
        <Card className="p-12 text-center text-sm text-slate-400">
          Select a patient to view their medical history.
        </Card>
      ) : (
        <div className="space-y-6">
          {timeline.allergies.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                Known Allergies
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {timeline.allergies.map((a) => (
                  <Badge key={a.id} tone={SEVERITY_TONES[a.severity] ?? "amber"}>
                    {a.allergen} - {a.severity}
                    {a.reaction ? ` (${a.reaction})` : ""}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Card>
            <CardHeader title="Timeline" icon={<IconRecords className="h-5 w-5" />} />
            <CardBody>
              {timeline.records.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">
                  No medical records yet.
                </p>
              ) : (
                <ol className="space-y-4 border-l-2 border-slate-200 pl-6">
                  {timeline.records.map((r) => (
                    <li key={r.id} className="relative">
                      <span className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 border-white bg-brand-600 ring-2 ring-brand-100" />
                      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge tone="teal">{formatVisitType(r.visit_type)}</Badge>
                            <span className="text-xs text-slate-500">
                              {formatDate(r.record_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-slate-500">
                              {r.doctor_name ?? "Unassigned"}
                            </span>
                            {editable && (
                              <button
                                onClick={() => handleDeleteRecord(r.id)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-red-600 transition hover:text-red-700"
                              >
                                <IconTrash className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                          {r.symptoms && (
                            <div>
                              <dt className="font-medium text-slate-700">Symptoms</dt>
                              <dd className="text-slate-600">{r.symptoms}</dd>
                            </div>
                          )}
                          {r.diagnosis && (
                            <div>
                              <dt className="font-medium text-slate-700">Diagnosis</dt>
                              <dd className="text-slate-600">{r.diagnosis}</dd>
                            </div>
                          )}
                          {r.treatment && (
                            <div>
                              <dt className="font-medium text-slate-700">Treatment</dt>
                              <dd className="text-slate-600">{r.treatment}</dd>
                            </div>
                          )}
                          {r.notes && (
                            <div>
                              <dt className="font-medium text-slate-700">Notes</dt>
                              <dd className="text-slate-600">{r.notes}</dd>
                            </div>
                          )}
                        </dl>
                        {r.prescriptions.length > 0 && (
                          <div className="mt-3 rounded-lg bg-slate-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Prescriptions
                            </p>
                            <ul className="mt-1.5 space-y-1 text-sm text-slate-600">
                              {r.prescriptions.map((p) => (
                                <li key={p.id}>
                                  <span className="font-medium text-slate-800">{p.medication}</span>
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
            </CardBody>
          </Card>
        </div>
      )}

      <Modal
        open={showRecordForm && editable}
        onClose={() => setShowRecordForm(false)}
        title="New Medical Record"
        subtitle="Record a patient visit, diagnosis, and prescriptions"
        size="xl"
      >
        <form onSubmit={submitRecord} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Attending doctor">
              <Select value={recordForm.doctor}
                onChange={(e) => setRecordForm({ ...recordForm, doctor: e.target.value })}>
                <option value="">Attending doctor...</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.full_name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Visit type">
              <Select value={recordForm.visit_type}
                onChange={(e) => setRecordForm({ ...recordForm, visit_type: e.target.value as VisitType })}>
                {VISIT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Symptoms">
              <Textarea placeholder="Symptoms" value={recordForm.symptoms} rows={2}
                onChange={(e) => setRecordForm({ ...recordForm, symptoms: e.target.value })} />
            </Field>
            <Field label="Diagnosis">
              <Textarea placeholder="Diagnosis" value={recordForm.diagnosis} rows={2}
                onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })} />
            </Field>
            <Field label="Treatment">
              <Textarea placeholder="Treatment" value={recordForm.treatment} rows={2}
                onChange={(e) => setRecordForm({ ...recordForm, treatment: e.target.value })} />
            </Field>
            <Field label="Notes">
              <Textarea placeholder="Notes" value={recordForm.notes} rows={2}
                onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })} />
            </Field>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Prescriptions</h3>
              <Button type="button" size="sm" variant="secondary" icon={<IconPlus className="h-4 w-4" />} onClick={addPrescriptionRow}>
                Add prescription
              </Button>
            </div>
            {prescriptions.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">No prescriptions added.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {prescriptions.map((p, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-[repeat(4,1fr)_auto]">
                    <Input placeholder="Medication" value={p.medication ?? ""}
                      onChange={(e) => updatePrescription(i, "medication", e.target.value)} />
                    <Input placeholder="Dosage" value={p.dosage ?? ""}
                      onChange={(e) => updatePrescription(i, "dosage", e.target.value)} />
                    <Input placeholder="Frequency" value={p.frequency ?? ""}
                      onChange={(e) => updatePrescription(i, "frequency", e.target.value)} />
                    <Input placeholder="Duration" value={p.duration ?? ""}
                      onChange={(e) => updatePrescription(i, "duration", e.target.value)} />
                    <button type="button" onClick={() => removePrescriptionRow(i)}
                      className="flex items-center justify-center rounded-lg px-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove prescription">
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowRecordForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Record"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showAllergyForm && editable}
        onClose={() => setShowAllergyForm(false)}
        title="New Allergy"
        subtitle="Record a patient allergy and severity"
      >
        <form onSubmit={submitAllergy} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Allergen" required>
              <Input required placeholder="e.g. Penicillin" value={allergyForm.allergen}
                onChange={(e) => setAllergyForm({ ...allergyForm, allergen: e.target.value })} />
            </Field>
            <Field label="Reaction">
              <Input placeholder="e.g. Rash" value={allergyForm.reaction}
                onChange={(e) => setAllergyForm({ ...allergyForm, reaction: e.target.value })} />
            </Field>
            <Field label="Severity" className="sm:col-span-2">
              <Select value={allergyForm.severity}
                onChange={(e) => setAllergyForm({ ...allergyForm, severity: e.target.value as typeof allergyForm.severity })}>
                {ALLERGY_SEVERITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAllergyForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Allergy"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
