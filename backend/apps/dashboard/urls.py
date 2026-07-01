from django.urls import path

from .views import DashboardStatsView, RecentActivityView

urlpatterns = [
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path(
        "dashboard/recent-activity/",
        RecentActivityView.as_view(),
        name="dashboard-recent-activity",
    ),
]
