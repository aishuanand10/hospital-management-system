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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
          <p className="text-slate-600">Hospital departments and staffing</p>
        </div>
        {editable && (
          <button
            onClick={openCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Add Department
          </button>
        )}
      </div>

      <input
        type="search"
        placeholder="Search departments..."
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
          <h2 className="text-lg font-semibold">
            {editing ? "Edit Department" : "New Department"}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input required placeholder="Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input required placeholder="Code (e.g. CARD)" value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input placeholder="Location" value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input placeholder="Phone" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <select value={form.head_doctor ?? ""}
              onChange={(e) => setForm({ ...form, head_doctor: e.target.value || null })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">No head doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.full_name}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Active
            </label>
            <textarea placeholder="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : departments.length === 0 ? (
          <p className="text-slate-500">No departments found.</p>
        ) : (
          departments.map((dept) => (
            <div key={dept.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{dept.name}</h3>
                  <p className="text-xs text-slate-500">{dept.code}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${dept.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                  {dept.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              {dept.description && (
                <p className="mt-2 text-sm text-slate-600">{dept.description}</p>
              )}
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Head</dt>
                  <dd className="text-slate-900">{dept.head_doctor_name ?? "-"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Doctors</dt>
                  <dd className="text-slate-900">{dept.doctor_count}</dd>
                </div>
                {dept.location && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Location</dt>
                    <dd className="text-slate-900">{dept.location}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <button onClick={() => toggleDoctors(dept)} className="text-blue-600 hover:underline">
                  {expanded === dept.id ? "Hide doctors" : "View doctors"}
                </button>
                {editable && (
                  <>
                    <button onClick={() => openEdit(dept)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(dept.id)} className="text-red-600 hover:underline">Delete</button>
                  </>
                )}
              </div>
              {expanded === dept.id && (
                <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
                  {deptDoctors.length === 0 ? (
                    <li className="text-slate-500">No doctors assigned.</li>
                  ) : (
                    deptDoctors.map((d) => (
                      <li key={d.id} className="flex justify-between">
                        <span className="text-slate-900">{d.full_name}</span>
                        <span className="text-slate-500">{d.specialty}</span>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
