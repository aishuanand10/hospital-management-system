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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctors</h1>
          <p className="text-slate-600">Manage doctor profiles</p>
        </div>
        {editable && (
          <button
            onClick={openCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Add Doctor
          </button>
        )}
      </div>

      <input
        type="search"
        placeholder="Search doctors..."
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
          <h2 className="text-lg font-semibold">{editing ? "Edit Doctor" : "New Doctor"}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input required placeholder="First name" value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input required placeholder="Last name" value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input required type="email" placeholder="Email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input required placeholder="Phone" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input required placeholder="Specialty" value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input required placeholder="License number" value={form.license_number}
              onChange={(e) => setForm({ ...form, license_number: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input required placeholder="Department (label)" value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <select value={form.department_ref ?? ""}
              onChange={(e) => setForm({ ...form, department_ref: e.target.value || null })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Assign to department...</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            <input type="number" min={0} placeholder="Years of experience" value={form.years_of_experience}
              onChange={(e) => setForm({ ...form, years_of_experience: Number(e.target.value) })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input type="number" min={0} step="0.01" placeholder="Consultation fee" value={form.consultation_fee}
              onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <textarea placeholder="Bio" value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
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
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Specialty</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">License</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>
            ) : doctors.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No doctors found.</td></tr>
            ) : (
              doctors.map((d) => (
                <tr key={d.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">{d.full_name}</td>
                  <td className="px-4 py-3">{d.specialty}</td>
                  <td className="px-4 py-3">{d.department}</td>
                  <td className="px-4 py-3">{d.license_number}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${d.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                      {d.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    {editable ? (
                      <>
                        <button onClick={() => openEdit(d)} className="text-blue-600 hover:underline">Edit</button>
                        <button onClick={() => handleDelete(d.id)} className="text-red-600 hover:underline">Delete</button>
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
