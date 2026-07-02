from django.urls import path

from .views import (
    DashboardStatsView,
    DepartmentStatsView,
    DoctorWorkloadView,
    PatientActivityView,
    RecentActivityView,
    RecentAppointmentsView,
)

urlpatterns = [
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path(
        "dashboard/recent-activity/",
        RecentActivityView.as_view(),
        name="dashboard-recent-activity",
    ),
    path(
        "dashboard/recent-appointments/",
        RecentAppointmentsView.as_view(),
        name="dashboard-recent-appointments",
    ),
    path(
        "dashboard/department-stats/",
        DepartmentStatsView.as_view(),
        name="dashboard-department-stats",
    ),
    path(
        "dashboard/doctor-workload/",
        DoctorWorkloadView.as_view(),
        name="dashboard-doctor-workload",
    ),
    path(
        "dashboard/patient-activity/",
        PatientActivityView.as_view(),
        name="dashboard-patient-activity",
    ),
]
