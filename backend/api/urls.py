from django.urls import path
from .views import *
from django.urls import path, include

urlpatterns = [
    # App-level routes
    path("", include("projects.urls")),
    path("", include("tasks.urls")),
    path("", include("chat.urls")),
    path("", include("event.urls")),
    path("", include("notifications.urls")),
    path("", include("memos.urls")),
    path("user/register/", CreateUserView.as_view(), name="register"),
    path("users/", UserListView.as_view(), name="user-list"),
    path("users/update/", UserUpdateView.as_view(), name="user-update"),
    path("users/me/password/", ChangePasswordView.as_view(), name="change-password"),
]
