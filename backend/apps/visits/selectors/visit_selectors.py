def get_user_visits(user):
    return user.booked_visits.all()
