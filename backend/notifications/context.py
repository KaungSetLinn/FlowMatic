import threading

_request_context = threading.local()


def set_current_user(user):
    _request_context.user = user


def get_current_user():
    return getattr(_request_context, "user", None)


def clear_current_user():
    _request_context.user = None
