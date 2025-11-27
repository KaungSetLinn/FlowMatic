
from django.db import models
from django.contrib.auth.models import AbstractUser


# Create your models here.
class User(AbstractUser):
    # make username not unique
    username = models.CharField(max_length=150, unique=False, blank=True, null=True)

    # enforce unique email instead
    email = models.EmailField(unique=True)
    

    # optional profile picture
    profile_picture = models.ImageField(
        upload_to="profile_pics/",  # saved under MEDIA_ROOT/profile_pics/
        blank=True,
        null=True,
    )

    USERNAME_FIELD = "email"   # login with email
    REQUIRED_FIELDS = ["username"]  # keep username for display, but not unique


