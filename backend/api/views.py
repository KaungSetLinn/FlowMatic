from django.shortcuts import render, get_object_or_404
from .models import *
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import *
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.http import Http404

# Create your views here.
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class EmailLoginView(generics.GenericAPIView):
    serializer_class = EmailLoginSerializer
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)

        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
            }
        }, status=status.HTTP_200_OK)
    
class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]  # Only authenticated users can access

    def get_queryset(self):
        current_user = self.request.user
        
        return User.objects.exclude(id = current_user.id)

class UsernameView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        try:
            target_user = get_object_or_404(User, id=user_id)
            current_user = request.user
            
            # Check if users share any projects
            shared_projects = current_user.projects.filter(
                assigned_users=target_user
            ).exists()
            
            if not shared_projects:
                return Response(status=status.HTTP_404_NOT_FOUND)
            
            return Response({
                'username': target_user.username
            })
            
        except Http404:
            return Response(status=status.HTTP_404_NOT_FOUND)