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
import { PageHeader, Alert } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { Card } from "@/components/ui/Card";
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconEdit,
  IconList,
  IconPlus,
  IconTrash,
} from "@/components/ui/icons";

const EMPTY_FORM = {
  patient: "",
  doctor: "",
  scheduled_at: "",
  duration_minutes: 30,
  status: "scheduled" as AppointmentStatus,
  reason: "",
  notes: "",
};

const STATUS_TONES: Record<string, BadgeTone> = {
  scheduled: "blue",
  confirmed: "green",
  completed: "gray",
  cancelled: "red",
  no_show: "amber",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  completed: "bg-slate-200 text-slate-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-amber-100 text-amber-700",
};

function statusTone(status: string): BadgeTone {
  return STATUS_TONES[status] ?? "gray";
}

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

  const today = new Date();
  const isToday = (day: number) =>
    calMonth.getFullYear() === today.getFullYear() &&
    calMonth.getMonth() === today.getMonth() &&
    day === today.getDate();

  const columns: Column<Appointment>[] = [
    {
      key: "patient",
      header: "Patient",
      sortValue: (a) => a.patient_name.toLowerCase(),
      render: (a) => <span className="font-medium text-slate-900">{a.patient_name}</span>,
    },
    { key: "doctor", header: "Doctor", sortValue: (a) => a.doctor_name.toLowerCase(), render: (a) => a.doctor_name },
    {
      key: "scheduled",
      header: "Scheduled",
      sortValue: (a) => a.scheduled_at,
      render: (a) => (
        <span className="whitespace-nowrap text-slate-600">
          {new Date(a.scheduled_at).toLocaleString()}
        </span>
      ),
    },
    { key: "reason", header: "Reason", render: (a) => a.reason },
    {
      key: "status",
      header: "Status",
      sortValue: (a) => a.status,
      render: (a) => <Badge tone={statusTone(a.status)}>{formatAppointmentStatus(a.status)}</Badge>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (a) =>
        editable ? (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" icon={<IconEdit className="h-4 w-4" />} onClick={() => openEdit(a)}>
              Edit
            </Button>
            <Button size="sm" variant="ghost" icon={<IconClock className="h-4 w-4" />} onClick={() => openReschedule(a)}>
              Reschedule
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-50"
              icon={<IconTrash className="h-4 w-4" />}
              onClick={() => handleDelete(a.id)}
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
      <PageHeader title="Appointments" subtitle="Schedule and manage appointments">
        <div className="flex rounded-lg border border-slate-300 bg-white p-0.5">
          <button
            onClick={() => setView("list")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              view === "list" ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <IconList className="h-4 w-4" />
            List
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              view === "calendar" ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <IconCalendar className="h-4 w-4" />
            Calendar
          </button>
        </div>
        {editable && (
          <Button onClick={openCreate} icon={<IconPlus className="h-4 w-4" />}>
            New Appointment
          </Button>
        )}
      </PageHeader>

      {view === "list" && (
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search appointments..."
          className="max-w-md"
        />
      )}

      {error && <Alert>{error}</Alert>}

      {view === "calendar" ? (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="secondary" size="sm" icon={<IconChevronLeft className="h-4 w-4" />} onClick={() => shiftMonth(-1)}>
              Prev
            </Button>
            <h2 className="text-lg font-semibold text-slate-900">{monthLabel}</h2>
            <Button variant="secondary" size="sm" onClick={() => shiftMonth(1)}>
              Next
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarCells.map((cell, i) => (
              <div
                key={i}
                className={`min-h-[92px] rounded-lg border p-1 text-left ${
                  cell ? "border-slate-200 bg-white" : "border-transparent bg-slate-50/60"
                }`}
              >
                {cell && (
                  <>
                    <div
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        isToday(cell.day) ? "bg-brand-600 text-white" : "text-slate-500"
                      }`}
                    >
                      {cell.day}
                    </div>
                    <div className="mt-1 space-y-1">
                      {cell.items.slice(0, 3).map((a) => (
                        <div
                          key={a.id}
                          title={`${a.patient_name} - ${a.doctor_name} - ${formatAppointmentStatus(a.status)}`}
                          className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${STATUS_COLORS[a.status] ?? "bg-slate-100 text-slate-700"}`}
                        >
                          {new Date(a.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                          {a.patient_name}
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
        </Card>
      ) : (
        <DataTable
          columns={columns}
          rows={appointments}
          rowKey={(a) => a.id}
          loading={loading}
          emptyMessage="No appointments found."
          initialSort={{ key: "scheduled", dir: "desc" }}
        />
      )}

      <Modal
        open={showForm && editable}
        onClose={() => setShowForm(false)}
        title={editing ? "Edit Appointment" : "New Appointment"}
        subtitle="Book or update a patient appointment"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Patient" required>
              <Select required value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })}>
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name} ({p.medical_record_number})</option>
                ))}
              </Select>
            </Field>
            <Field label="Doctor" required>
              <Select required value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })}>
                <option value="">Select doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.full_name} - {d.specialty}</option>
                ))}
              </Select>
            </Field>
            <Field label="Date & time" required>
              <Input required type="datetime-local" value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            </Field>
            <Field label="Duration (minutes)">
              <Input type="number" min={15} step={15} value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AppointmentStatus })}>
                {APPOINTMENT_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Reason" required>
              <Input required placeholder="Reason for visit" value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea placeholder="Notes" value={form.notes} rows={2}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Appointment"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={reschedTarget !== null}
        onClose={() => setReschedTarget(null)}
        title="Reschedule Appointment"
        subtitle={
          reschedTarget
            ? `${reschedTarget.patient_name} with ${reschedTarget.doctor_name}`
            : undefined
        }
      >
        <form onSubmit={submitReschedule} className="space-y-5">
          <Field label="New date & time" required>
            <Input required type="datetime-local" value={reschedValue}
              onChange={(e) => setReschedValue(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={() => setReschedTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Confirm reschedule"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
