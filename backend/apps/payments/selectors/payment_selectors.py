def get_payments_for_user(user):
    return user.payments_made.all()
