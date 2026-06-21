from django.urls import path

from .views import (
    admin_report,
    api_index,
    dashboard_report,
    db_status,
    domain_login,
    freeze_interval,
    session_info,
    sign_out,
    templates_report,
    users_collection,
    users_detail,
    users_options,
)

urlpatterns = [
    path('', api_index, name='api-index'),
    path('db-status/', db_status, name='db-status'),
    path('dashboard/', dashboard_report, name='dashboard-report'),
    path('admin-report/', admin_report, name='admin-report'),
    path('templates/', templates_report, name='templates-report'),
    path('freeze-interval/', freeze_interval, name='freeze-interval'),
    path('users/', users_collection, name='users-collection'),
    path('users/options/', users_options, name='users-options'),
    path('users/<int:pk>/', users_detail, name='users-detail'),
    path('login/', domain_login, name='domain-login'),
    path('logout/', sign_out, name='sign-out'),
    path('session/', session_info, name='session-info'),
]
