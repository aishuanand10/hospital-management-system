"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  createAppointment,
  deleteAppointment,
  listAppointments,
  rescheduleAppointment,
  updateAppointment,
} from "@/lib/api/appointments";
import { listDoctors } from "@/lib/api/doctors";
import { listPatients } from "@/lib/api/patients";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { canWrite } from "@/lib/auth/rbac";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { APPOINTMENT_STATUS_OPTIONS, formatAppointmentStatus } from "@/types/appointment";
import type { Doctor } from "@/types/doctor";
import type { Patient } from "@/types/patient";

const EMPTY_FORM = {
  patient: "",
  doctor: "",
  scheduled_at: "",
  duration_minutes: 30,
  status: "scheduled" as AppointmentStatus,
  reason: "",
  notes: "",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  completed: "bg-slate-200 text-slate-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-amber-100 text-amber-700",
};

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const editable = canWrite("appointments", user?.role);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [reschedTarget, setReschedTarget] = useState<Appointment | null>(null);
  const [reschedValue, setReschedValue] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [apptData, patientData, doctorData] = await Promise.all([
        listAppointments(search || undefined),
        listPatients(),
        listDoctors(),
      ]);
      setAppointments(apptData.results);
      setPatients(patientData.results);
      setDoctors(doctorData.results);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadData, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (appt: Appointment) => {
    setEditing(appt);
    setForm({
      patient: appt.patient,
      doctor: appt.doctor,
      scheduled_at: toDatetimeLocalValue(appt.scheduled_at),
      duration_minutes: appt.duration_minutes,
      status: appt.status,
      reason: appt.reason,
      notes: appt.notes,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ...form,
        scheduled_at: fromDatetimeLocalValue(form.scheduled_at),
      };
      if (editing) {
        await updateAppointment(editing.id, payload);
      } else {
        await createAppointment(payload);
      }
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this appointment?")) return;
    try {
      await deleteAppointment(id);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete appointment.");
    }
  };

  const openReschedule = (appt: Appointment) => {
    setReschedTarget(appt);
    setReschedValue(toDatetimeLocalValue(appt.scheduled_at));
    setError("");
  };

  const submitReschedule = async (e: FormEvent) => {
    e.preventDefault();
    if (!reschedTarget) return;
    setSubmitting(true);
    setError("");
    try {
      await rescheduleAppointment(reschedTarget.id, fromDatetimeLocalValue(reschedValue));
      setReschedTarget(null);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reschedule.");
    } finally {
      setSubmitting(false);
    }
  };

  const calendarCells = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const byDay: Record<number, Appointment[]> = {};
    for (const a of appointments) {
      const d = new Date(a.scheduled_at);
      if (d.getFullYear() === year && d.getMonth() === month) {
        (byDay[d.getDate()] ??= []).push(a);
      }
    }
    const cells: ({ day: number; items: Appointment[] } | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ day, items: (byDay[day] ?? []).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)) });
    }
    return cells;
  }, [appointments, calMonth]);

  const monthLabel = calMonth.toLocaleString(undefined, { month: "long", year: "numeric" });
  const shiftMonth = (delta: number) =>
    setCalMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-slate-600">Schedule and manage appointments</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-300 p-0.5">
            <button
              onClick={() => setView("list")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === "list" ? "bg-blue-600 text-white" : "text-slate-600"}`}
            >
              List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === "calendar" ? "bg-blue-600 text-white" : "text-slate-600"}`}
            >
              Calendar
            </button>
          </div>
          {editable && (
            <button
              onClick={openCreate}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              New Appointment
            </button>
          )}
        </div>
      </div>

      {view === "list" && (
        <input
          type="search"
          placeholder="Search appointments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      )}

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
          <h2 className="text-lg font-semibold">{editing ? "Edit Appointment" : "New Appointment"}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <select required value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name} ({p.medical_record_number})</option>
              ))}
            </select>
            <select required value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.full_name} - {d.specialty}</option>
              ))}
            </select>
            <input required type="datetime-local" value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input type="number" min={15} step={15} value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AppointmentStatus })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {APPOINTMENT_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <input required placeholder="Reason for visit" value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
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

      {reschedTarget && (
        <form onSubmit={submitReschedule} className="rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Reschedule: {reschedTarget.patient_name} with {reschedTarget.doctor_name}
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input required type="datetime-local" value={reschedValue}
              onChange={(e) => setReschedValue(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {submitting ? "Saving..." : "Confirm reschedule"}
            </button>
            <button type="button" onClick={() => setReschedTarget(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {view === "calendar" ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <button onClick={() => shiftMonth(-1)} className="rounded-lg border border-slate-300 px-3 py-1 text-sm">Prev</button>
            <h2 className="text-lg font-semibold text-slate-900">{monthLabel}</h2>
            <button onClick={() => shiftMonth(1)} className="rounded-lg border border-slate-300 px-3 py-1 text-sm">Next</button>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-px text-center text-xs font-medium text-slate-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarCells.map((cell, i) => (
              <div key={i} className={`min-h-[90px] rounded-lg border p-1 text-left ${cell ? "border-slate-200" : "border-transparent bg-slate-50"}`}>
                {cell && (
                  <>
                    <div className="text-xs font-medium text-slate-500">{cell.day}</div>
                    <div className="mt-1 space-y-1">
                      {cell.items.slice(0, 3).map((a) => (
                        <div key={a.id}
                          title={`${a.patient_name} - ${a.doctor_name} - ${formatAppointmentStatus(a.status)}`}
                          className={`truncate rounded px-1 py-0.5 text-[10px] ${STATUS_COLORS[a.status] ?? "bg-slate-100 text-slate-700"}`}>
                          {new Date(a.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} {a.patient_name}
                        </div>
                      ))}
                      {cell.items.length > 3 && (
                        <div className="text-[10px] text-slate-400">+{cell.items.length - 3} more</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Scheduled</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No appointments found.</td></tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100">
                    <td className="px-4 py-3">{a.patient_name}</td>
                    <td className="px-4 py-3">{a.doctor_name}</td>
                    <td className="px-4 py-3">{new Date(a.scheduled_at).toLocaleString()}</td>
                    <td className="px-4 py-3">{a.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[a.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {formatAppointmentStatus(a.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      {editable ? (
                        <>
                          <button onClick={() => openEdit(a)} className="text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => openReschedule(a)} className="text-blue-600 hover:underline">Reschedule</button>
                          <button onClick={() => handleDelete(a.id)} className="text-red-600 hover:underline">Delete</button>
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
      )}
    </div>
  );
}
