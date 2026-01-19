from django.contrib.auth import get_user_model, authenticate, password_validation
from rest_framework import serializers

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "confirm_password", "profile_picture", "date_joined"]
        extra_kwargs = {
            "password": {"write_only": True},
            "email": {"required": True},
            "profile_picture": {"required": False},  # 👈 optional
            "date_joined": {"read_only": True},
        }

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        user = User.objects.create_user(
            username=validated_data.get("username"),
            email=validated_data["email"],
            password=validated_data["password"],
            profile_picture=validated_data.get("profile_picture"),  # handles optional
        )
        return user
    
class UserReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "profile_picture",
            "date_joined",
        ]
    
class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "profile_picture"]
        extra_kwargs = {
            "username": {"required": False},
            "profile_picture": {"required": False},
        }

    def update(self, instance, validated_data):
        # Only update fields that are actually in validated_data
        if "username" in validated_data:
            instance.username = validated_data["username"]
        
        if "profile_picture" in validated_data:
            profile_picture = validated_data["profile_picture"]
            if profile_picture is None:
                # Delete the profile picture
                if instance.profile_picture:
                    instance.profile_picture.delete(save=False)
                instance.profile_picture = None
            else:
                # Update with new picture
                if instance.profile_picture:
                    instance.profile_picture.delete(save=False)
                instance.profile_picture = profile_picture
        
        instance.save()
        return instance
    
class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password = serializers.CharField()
    confirm_password = serializers.CharField()

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("現在のパスワードは正しくありません。")
        return value

    def validate(self, attrs):
        # Check if new password matches confirmation
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": "新しいパスワードが一致しません。"
            })

        # Validate new password using Django's built-in validators
        user = self.context["request"].user
        try:
            password_validation.validate_password(attrs["new_password"], user=user)
        except serializers.ValidationError as e:
            raise serializers.ValidationError({"new_password": list(e.messages)})

        return attrs

    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user
    
class EmailLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")

        user = authenticate(username=email, password=password)

        if user is None:
            raise serializers.ValidationError({
                "message": "メールアドレス、またはパスワードは正しくありません"
            })

        if not user.is_active:
            raise serializers.ValidationError({
                "message": "User account is disabled."
            })

        data["user"] = user
        return data
