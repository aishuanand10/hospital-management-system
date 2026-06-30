from .base import *  # noqa: F403

DEBUG = True

INSTALLED_APPS += [  # noqa: F405
    # Dev tools can be added here
]

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
