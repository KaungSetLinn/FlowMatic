from django.urls import path
from .views import *
from django.urls import path, include

urlpatterns = [

    # App-level routes
    path("", include("tasks.urls")),

    path("user/register/", CreateUserView.as_view(), name="register"),
    path("users/", UserListView.as_view(), name="user-list"),

]