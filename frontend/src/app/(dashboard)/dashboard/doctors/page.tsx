"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import {
  createDoctor,
  deleteDoctor,
  listDoctors,
  updateDoctor,
} from "@/lib/api/doctors";
import { listDepartments } from "@/lib/api/departments";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { canWrite } from "@/lib/auth/rbac";
import type { Doctor } from "@/types/doctor";
import type { Department } from "@/types/department";
import { PageHeader, Alert } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { IconEdit, IconPlus, IconTrash } from "@/components/ui/icons";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  specialty: "",
  license_number: "",
  department: "",
  department_ref: null as string | null,
  years_of_experience: 0,
  consultation_fee: "0",
  bio: "",
  is_active: true,
  user: null as string | null,
};

export default function DoctorsPage() {
  const { user } = useAuth();
  const editable = canWrite("doctors", user?.role);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listDoctors(search || undefined);
      setDoctors(data.results);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load doctors.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadDoctors, 300);
    return () => clearTimeout(timer);
  }, [loadDoctors]);

  useEffect(() => {
    listDepartments()
      .then((data) => setDepartments(data.results))
      .catch(() => undefined);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (doctor: Doctor) => {
    setEditing(doctor);
    setForm({
      first_name: doctor.first_name,
      last_name: doctor.last_name,
      email: doctor.email,
      phone: doctor.phone,
      specialty: doctor.specialty,
      license_number: doctor.license_number,
      department: doctor.department,
      department_ref: doctor.department_ref,
      years_of_experience: doctor.years_of_experience,
      consultation_fee: doctor.consultation_fee,
      bio: doctor.bio,
      is_active: doctor.is_active,
      user: doctor.user,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (editing) {
        await updateDoctor(editing.id, form);
      } else {
        await createDoctor(form);
      }
      setShowForm(false);
      await loadDoctors();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save doctor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this doctor?")) return;
    try {
      await deleteDoctor(id);
      await loadDoctors();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete doctor.");
    }
  };

  const columns: Column<Doctor>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (d) => d.full_name.toLowerCase(),
      render: (d) => (
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
            {d.full_name.charAt(0).toUpperCase()}
          </span>
          <span className="font-medium text-slate-900">{d.full_name}</span>
        </div>
      ),
    },
    {
      key: "specialty",
      header: "Specialty",
      sortValue: (d) => d.specialty.toLowerCase(),
      render: (d) => d.specialty,
    },
    {
      key: "department",
      header: "Department",
      sortValue: (d) => d.department.toLowerCase(),
      render: (d) => d.department,
    },
    { key: "license_number", header: "License", render: (d) => d.license_number },
    {
      key: "status",
      header: "Status",
      sortValue: (d) => (d.is_active ? 1 : 0),
      render: (d) => (
        <Badge tone={d.is_active ? "green" : "gray"}>
          {d.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (d) =>
        editable ? (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" icon={<IconEdit className="h-4 w-4" />} onClick={() => openEdit(d)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-50"
              icon={<IconTrash className="h-4 w-4" />}
              onClick={() => handleDelete(d.id)}
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
      <PageHeader title="Doctors" subtitle="Manage doctor profiles">
        {editable && (
          <Button onClick={openCreate} icon={<IconPlus className="h-4 w-4" />}>
            Add Doctor
          </Button>
        )}
      </PageHeader>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search doctors by name or specialty..."
        className="max-w-md"
      />

      {error && <Alert>{error}</Alert>}

      <DataTable
        columns={columns}
        rows={doctors}
        rowKey={(d) => d.id}
        loading={loading}
        emptyMessage="No doctors found."
      />

      <Modal
        open={showForm && editable}
        onClose={() => setShowForm(false)}
        title={editing ? "Edit Doctor" : "New Doctor"}
        subtitle="Doctor profile and department assignment"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" required>
              <Input required placeholder="First name" value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </Field>
            <Field label="Last name" required>
              <Input required placeholder="Last name" value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </Field>
            <Field label="Email" required>
              <Input required type="email" placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Phone" required>
              <Input required placeholder="Phone" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Specialty" required>
              <Input required placeholder="Specialty" value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
            </Field>
            <Field label="License number" required>
              <Input required placeholder="License number" value={form.license_number}
                onChange={(e) => setForm({ ...form, license_number: e.target.value })} />
            </Field>
            <Field label="Department (label)" required>
              <Input required placeholder="e.g. Cardiology" value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </Field>
            <Field label="Assign to department">
              <Select value={form.department_ref ?? ""}
                onChange={(e) => setForm({ ...form, department_ref: e.target.value || null })}>
                <option value="">Assign to department...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Years of experience">
              <Input type="number" min={0} value={form.years_of_experience}
                onChange={(e) => setForm({ ...form, years_of_experience: Number(e.target.value) })} />
            </Field>
            <Field label="Consultation fee">
              <Input type="number" min={0} step="0.01" value={form.consultation_fee}
                onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })} />
            </Field>
            <Field label="Bio" className="sm:col-span-2">
              <Textarea placeholder="Short professional bio" value={form.bio} rows={2}
                onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Doctor"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
