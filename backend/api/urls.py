from django.urls import path
from .views import *
from django.urls import path, include

urlpatterns = [

    # App-level routes
    path("", include("tasks.urls")),
    path("", include("projects.urls")),
    
    path("", include("chat.urls")),
    path("", include("event.urls")),

    path("user/register/", CreateUserView.as_view(), name="register"),
    path("users/", UserListView.as_view(), name="user-list"),
    path("user/<int:user_id>/username/", UsernameView.as_view(), name="username"),

]