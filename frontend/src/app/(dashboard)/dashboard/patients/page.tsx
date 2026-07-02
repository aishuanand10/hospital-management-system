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
import { PageHeader, Alert } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { IconEdit, IconPlus, IconTrash } from "@/components/ui/icons";

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

  const columns: Column<Patient>[] = [
    {
      key: "medical_record_number",
      header: "MRN",
      sortValue: (p) => p.medical_record_number,
      render: (p) => (
        <span className="font-medium text-slate-900">{p.medical_record_number}</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      sortValue: (p) => p.full_name.toLowerCase(),
      render: (p) => (
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
            {p.full_name.charAt(0).toUpperCase()}
          </span>
          <span className="font-medium text-slate-900">{p.full_name}</span>
        </div>
      ),
    },
    { key: "phone", header: "Phone", render: (p) => p.phone },
    {
      key: "gender",
      header: "Gender",
      sortValue: (p) => p.gender,
      render: (p) => <span className="capitalize">{p.gender.replace(/_/g, " ")}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (p) => (p.is_active ? 1 : 0),
      render: (p) => (
        <Badge tone={p.is_active ? "green" : "gray"}>
          {p.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (p) =>
        editable ? (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" icon={<IconEdit className="h-4 w-4" />} onClick={() => openEdit(p)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-50"
              icon={<IconTrash className="h-4 w-4" />}
              onClick={() => handleDelete(p.id)}
            >
              Delete
            </Button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">View only</span>
        ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Patients" subtitle="Manage patient records">
        {editable && (
          <Button onClick={openCreate} icon={<IconPlus className="h-4 w-4" />}>
            Add Patient
          </Button>
        )}
      </PageHeader>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search patients by name, MRN, or phone..."
        className="max-w-md"
      />

      {error && <Alert>{error}</Alert>}

      <DataTable
        columns={columns}
        rows={patients}
        rowKey={(p) => p.id}
        loading={loading}
        emptyMessage="No patients found."
      />

      <Modal
        open={showForm && editable}
        onClose={() => setShowForm(false)}
        title={editing ? "Edit Patient" : "New Patient"}
        subtitle="Patient demographic and contact details"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="MRN" required>
              <Input required placeholder="MRN-0001" value={form.medical_record_number}
                onChange={(e) => setForm({ ...form, medical_record_number: e.target.value })} />
            </Field>
            <Field label="Phone" required>
              <Input required placeholder="Phone" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="First name" required>
              <Input required placeholder="First name" value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </Field>
            <Field label="Last name" required>
              <Input required placeholder="Last name" value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Date of birth" required>
              <Input required type="date" value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </Field>
            <Field label="Gender">
              <Select value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as typeof form.gender })}>
                {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </Field>
            <Field label="Blood group">
              <Select value={form.blood_group}
                onChange={(e) => setForm({ ...form, blood_group: e.target.value as typeof form.blood_group })}>
                {BLOOD_GROUP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Input placeholder="Address" value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <Field label="Emergency contact name">
              <Input placeholder="Contact name" value={form.emergency_contact_name}
                onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} />
            </Field>
            <Field label="Emergency contact phone">
              <Input placeholder="Contact phone" value={form.emergency_contact_phone}
                onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea placeholder="Notes" value={form.notes} rows={2}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Active patient
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Patient"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
