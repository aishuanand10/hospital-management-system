from .base import *  # noqa: F403

DEBUG = False

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

DATABASES = {  # noqa: F405
    "default": {
        **DATABASES["default"],  # noqa: F405
        "NAME": "test_hsm",
    }
}
