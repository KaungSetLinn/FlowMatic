from .context import set_current_user, clear_current_user
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import AnonymousUser


class NotificationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_auth = JWTAuthentication()

    def __call__(self, request):
        user = request.user

        if user.is_anonymous:
            auth_header = request.META.get("HTTP_AUTHORIZATION")
            if auth_header:
                try:
                    auth_result = self.jwt_auth.authenticate(request)
                    if auth_result is not None:
                        user = auth_result[0]
                except Exception:
                    pass

        set_current_user(user)
        try:
            response = self.get_response(request)
        finally:
            clear_current_user()
        return response
