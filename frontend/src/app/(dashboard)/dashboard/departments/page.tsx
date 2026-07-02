"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/providers/AuthProvider";
import { ApiError } from "@/lib/api/client";
import {
  createDepartment,
  deleteDepartment,
  getDepartmentDoctors,
  listDepartments,
  updateDepartment,
} from "@/lib/api/departments";
import { listDoctors } from "@/lib/api/doctors";
import { canWrite } from "@/lib/auth/rbac";
import type { Department, DepartmentDoctor } from "@/types/department";
import type { Doctor } from "@/types/doctor";
import { PageHeader, Alert } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import {
  IconChevronRight,
  IconDepartments,
  IconEdit,
  IconPlus,
  IconTrash,
} from "@/components/ui/icons";

const EMPTY_FORM = {
  name: "",
  code: "",
  description: "",
  location: "",
  phone: "",
  head_doctor: null as string | null,
  is_active: true,
};

export default function DepartmentsPage() {
  const { user } = useAuth();
  const editable = canWrite("departments", user?.role);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deptDoctors, setDeptDoctors] = useState<DepartmentDoctor[]>([]);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listDepartments(search || undefined);
      setDepartments(data.results);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load departments.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadDepartments, 300);
    return () => clearTimeout(timer);
  }, [loadDepartments]);

  useEffect(() => {
    listDoctors()
      .then((data) => setDoctors(data.results))
      .catch(() => undefined);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setForm({
      name: dept.name,
      code: dept.code,
      description: dept.description,
      location: dept.location,
      phone: dept.phone,
      head_doctor: dept.head_doctor,
      is_active: dept.is_active,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (editing) {
        await updateDepartment(editing.id, form);
      } else {
        await createDepartment(form);
      }
      setShowForm(false);
      await loadDepartments();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save department.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this department?")) return;
    try {
      await deleteDepartment(id);
      await loadDepartments();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete department.");
    }
  };

  const toggleDoctors = async (dept: Department) => {
    if (expanded === dept.id) {
      setExpanded(null);
      return;
    }
    setExpanded(dept.id);
    setDeptDoctors([]);
    try {
      const list = await getDepartmentDoctors(dept.id);
      setDeptDoctors(list);
    } catch {
      setDeptDoctors([]);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Departments" subtitle="Hospital departments and staffing">
        {editable && (
          <Button onClick={openCreate} icon={<IconPlus className="h-4 w-4" />}>
            Add Department
          </Button>
        )}
      </PageHeader>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search departments..."
        className="max-w-md"
      />

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="inline-flex items-center gap-2 text-slate-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
            Loading...
          </span>
        </div>
      ) : departments.length === 0 ? (
        <Card className="p-12 text-center text-sm text-slate-400">
          No departments found.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <Card key={dept.id} className="flex flex-col p-5 transition hover:shadow-card-hover">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <IconDepartments className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-900">{dept.name}</h3>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {dept.code}
                    </p>
                  </div>
                </div>
                <Badge tone={dept.is_active ? "green" : "gray"}>
                  {dept.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              {dept.description && (
                <p className="mt-3 text-sm text-slate-600">{dept.description}</p>
              )}

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Head</dt>
                  <dd className="font-medium text-slate-900">
                    {dept.head_doctor_name ?? "-"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Doctors</dt>
                  <dd className="font-medium text-slate-900">{dept.doctor_count}</dd>
                </div>
                {dept.location && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Location</dt>
                    <dd className="font-medium text-slate-900">{dept.location}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-4 flex flex-1 items-end justify-between border-t border-slate-100 pt-3">
                <button
                  onClick={() => toggleDoctors(dept)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 transition hover:text-brand-700"
                >
                  <IconChevronRight
                    className={`h-4 w-4 transition-transform ${expanded === dept.id ? "rotate-90" : ""}`}
                  />
                  {expanded === dept.id ? "Hide doctors" : "View doctors"}
                </button>
                {editable && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" icon={<IconEdit className="h-4 w-4" />} onClick={() => openEdit(dept)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      icon={<IconTrash className="h-4 w-4" />}
                      onClick={() => handleDelete(dept.id)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              {expanded === dept.id && (
                <ul className="mt-3 space-y-1.5 rounded-xl bg-slate-50 p-3 text-sm">
                  {deptDoctors.length === 0 ? (
                    <li className="text-slate-400">No doctors assigned.</li>
                  ) : (
                    deptDoctors.map((d) => (
                      <li key={d.id} className="flex justify-between">
                        <span className="font-medium text-slate-800">{d.full_name}</span>
                        <span className="text-slate-500">{d.specialty}</span>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showForm && editable}
        onClose={() => setShowForm(false)}
        title={editing ? "Edit Department" : "New Department"}
        subtitle="Department details and lead clinician"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required>
              <Input required placeholder="Cardiology" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Code" required>
              <Input required placeholder="CARD" value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </Field>
            <Field label="Location">
              <Input placeholder="Building / floor" value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input placeholder="Phone" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Head doctor" className="sm:col-span-2">
              <Select value={form.head_doctor ?? ""}
                onChange={(e) => setForm({ ...form, head_doctor: e.target.value || null })}>
                <option value="">No head doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.full_name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea placeholder="Description" value={form.description} rows={2}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Active department
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Department"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
