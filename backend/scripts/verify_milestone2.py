"""End-to-end verification for Milestone 2 (RBAC + new endpoints).

Run inside the backend container:
    python scripts/verify_milestone2.py
Uses only the standard library (urllib).
"""

import json
import urllib.error
import urllib.request

BASE = "http://localhost:8000/api/v1"

USERS = {
    "admin": ("admin@hospital.com", "changeme123"),
    "doctor": ("doctor@hospital.com", "doctorpass123"),
    "receptionist": ("receptionist@hospital.com", "receptionpass123"),
    "patient": ("patient@hospital.com", "patientpass123"),
}

results = []


def req(method, path, token=None, data=None):
    url = f"{BASE}{path}"
    body = json.dumps(data).encode() if data is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            payload = resp.read().decode()
            return resp.status, json.loads(payload) if payload else {}
    except urllib.error.HTTPError as e:
        payload = e.read().decode()
        try:
            return e.code, json.loads(payload) if payload else {}
        except json.JSONDecodeError:
            return e.code, {"raw": payload[:200]}


def check(name, condition):
    status = "PASS" if condition else "FAIL"
    results.append((status, name))
    print(f"[{status}] {name}")


def login(email, password):
    status, data = req("POST", "/auth/login/", data={"email": email, "password": password})
    return data.get("access") if status == 200 else None


# Resolve admin password (seed_admin default). Try a couple common values.
def admin_login():
    return login("admin@hospital.com", "adminpassword123")


def main():
    tokens = {}
    tokens["admin"] = admin_login()
    check("Admin can log in", tokens["admin"] is not None)
    for role in ("doctor", "receptionist", "patient"):
        email, pw = USERS[role]
        tokens[role] = login(email, pw)
        check(f"{role} can log in", tokens[role] is not None)

    admin = tokens["admin"]
    doctor = tokens["doctor"]
    reception = tokens["receptionist"]
    patient = tokens["patient"]

    # Departments
    s, _ = req("GET", "/departments/", admin)
    check("GET departments (admin) 200", s == 200)
    s, _ = req("POST", "/departments/", doctor, {"name": "Neuro Verify", "code": "NVER"})
    check("POST department as doctor -> 403", s == 403)
    s, dept = req("POST", "/departments/", admin, {"name": "Neuro Verify", "code": "NVER"})
    check("POST department as admin -> 201", s == 201)

    # Department doctors listing
    if s == 201:
        s2, _ = req("GET", f"/departments/{dept['id']}/doctors/", admin)
        check("GET department doctors -> 200", s2 == 200)

    # Doctors read-only for non-admin
    s, _ = req("POST", "/doctors/", doctor, {
        "first_name": "V", "last_name": "T", "email": "vt.verify@hospital.com",
        "phone": "1", "specialty": "X", "license_number": "MD-VER1", "department": "X",
    })
    check("POST doctor as doctor -> 403", s == 403)

    # Medical records RBAC
    s, patients = req("GET", "/patients/", admin)
    pid = patients["results"][0]["id"] if patients.get("results") else None
    s, doctors = req("GET", "/doctors/", admin)
    did = doctors["results"][0]["id"] if doctors.get("results") else None

    s, _ = req("POST", "/medical-records/", reception, {"patient": pid, "diagnosis": "x"})
    check("POST medical record as receptionist -> 403", s == 403)
    s, rec = req("POST", "/medical-records/", doctor, {
        "patient": pid, "doctor": did, "visit_type": "consultation",
        "diagnosis": "Verify dx", "prescriptions": [{"medication": "VerMed", "dosage": "1"}],
    })
    check("POST medical record as doctor -> 201", s == 201)
    check("Medical record has nested prescription", bool(rec.get("prescriptions")))

    # Patient scoping
    s, mr_patient = req("GET", "/medical-records/", patient)
    check("Patient can list own medical records", s == 200)

    s, appts_patient = req("GET", "/appointments/", patient)
    check("Patient can list own appointments", s == 200)

    # Appointment conflict detection
    slot = "2030-01-01T10:00:00Z"
    s, a1 = req("POST", "/appointments/", admin, {
        "patient": pid, "doctor": did, "scheduled_at": slot,
        "duration_minutes": 30, "reason": "Verify1",
    })
    check("Create appointment -> 201", s == 201)
    s, a2 = req("POST", "/appointments/", admin, {
        "patient": pid, "doctor": did, "scheduled_at": "2030-01-01T10:15:00Z",
        "duration_minutes": 30, "reason": "Verify overlap",
    })
    check("Conflicting appointment -> 400", s == 400)

    # Reschedule
    if a1.get("id"):
        s, _ = req("POST", f"/appointments/{a1['id']}/reschedule/", admin,
                   {"scheduled_at": "2030-01-02T09:00:00Z"})
        check("Reschedule appointment -> 200", s == 200)

    # Availability RBAC
    s, _ = req("POST", "/availabilities/", patient, {
        "doctor": did, "weekday": 0, "start_time": "09:00", "end_time": "17:00",
    })
    check("Availability create as patient -> 403", s == 403)

    # Dashboard endpoints
    for ep in ("stats", "recent-appointments", "department-stats",
               "doctor-workload", "patient-activity"):
        s, _ = req("GET", f"/dashboard/{ep}/", admin)
        check(f"Dashboard {ep} -> 200", s == 200)

    # Schema includes new endpoints
    try:
        with urllib.request.urlopen("http://localhost:8000/api/schema/") as resp:
            schema = resp.read().decode()
        check("Schema lists /medical-records/", "/medical-records/" in schema)
        check("Schema lists /departments/", "/departments/" in schema)
        check("Schema lists /availabilities/", "/availabilities/" in schema)
    except urllib.error.HTTPError as e:
        check("Schema endpoint reachable", False)
        print("schema error", e.code)

    total = len(results)
    passed = sum(1 for st, _ in results if st == "PASS")
    print(f"\n==== {passed}/{total} checks passed ====")
    return 0 if passed == total else 1


if __name__ == "__main__":
    raise SystemExit(main())
