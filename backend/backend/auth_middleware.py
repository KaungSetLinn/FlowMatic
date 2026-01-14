from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from django.contrib.auth.models import AnonymousUser


class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app
        self.jwt_auth = JWTAuthentication()

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        token = None

        for param in query_string.split("&"):
            if param.startswith("token="):
                token = param.split("=", 1)[1]
                break

        if token:
            from asgiref.sync import sync_to_async

            @sync_to_async
            def get_user():
                try:
                    validated_token = self.jwt_auth.get_validated_token(token)
                    return self.jwt_auth.get_user(validated_token)
                except (InvalidToken, AuthenticationFailed):
                    return AnonymousUser()

            scope["user"] = await get_user()
        else:
            scope["user"] = AnonymousUser()

        return await self.app(scope, receive, send)
