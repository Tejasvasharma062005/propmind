def get_unread_notifications(user):
    return user.notifications.filter(is_read=False)
