"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import {
  createPatient,
  deletePatient,
  listPatients,
  updatePatient,
} from "@/lib/api/patients";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { canWrite } from "@/lib/auth/rbac";
import type { BloodGroup, Gender, Patient } from "@/types/patient";
import { BLOOD_GROUP_OPTIONS, GENDER_OPTIONS } from "@/types/patient";

const EMPTY_FORM = {
  medical_record_number: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  gender: "male" as Gender,
  blood_group: "unknown" as BloodGroup,
  address: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  notes: "",
  is_active: true,
};

export default function PatientsPage() {
  const { user } = useAuth();
  const editable = canWrite("patients", user?.role);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listPatients(search || undefined);
      setPatients(data.results);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load patients.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadPatients, 300);
    return () => clearTimeout(timer);
  }, [loadPatients]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (patient: Patient) => {
    setEditing(patient);
    setForm({
      medical_record_number: patient.medical_record_number,
      first_name: patient.first_name,
      last_name: patient.last_name,
      email: patient.email,
      phone: patient.phone,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      blood_group: patient.blood_group,
      address: patient.address,
      emergency_contact_name: patient.emergency_contact_name,
      emergency_contact_phone: patient.emergency_contact_phone,
      notes: patient.notes,
      is_active: patient.is_active,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (editing) {
        await updatePatient(editing.id, form);
      } else {
        await createPatient(form);
      }
      setShowForm(false);
      await loadPatients();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save patient.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this patient?")) return;
    try {
      await deletePatient(id);
      await loadPatients();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete patient.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-slate-600">Manage patient records</p>
        </div>
        {editable && (
          <button
            onClick={openCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Add Patient
          </button>
        )}
      </div>

      <input
        type="search"
        placeholder="Search patients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && editable && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold">{editing ? "Edit Patient" : "New Patient"}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input required placeholder="MRN" value={form.medical_record_number}
              onChange={(e) => setForm({ ...form, medical_record_number: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input required placeholder="First name" value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input required placeholder="Last name" value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input placeholder="Email" type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input required placeholder="Phone" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input required type="date" value={form.date_of_birth}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as typeof form.gender })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value as typeof form.blood_group })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {BLOOD_GROUP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input placeholder="Address" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input placeholder="Emergency contact name" value={form.emergency_contact_name}
              onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input placeholder="Emergency contact phone" value={form.emergency_contact_phone}
              onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <textarea placeholder="Notes" value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={2} />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {submitting ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">MRN</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No patients found.</td></tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">{p.medical_record_number}</td>
                  <td className="px-4 py-3">{p.full_name}</td>
                  <td className="px-4 py-3">{p.phone}</td>
                  <td className="px-4 py-3 capitalize">{p.gender.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${p.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    {editable ? (
                      <>
                        <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline">Edit</button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">Delete</button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">View only</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
