def get_user_transactions(user):
    return user.buyer_transactions.all()
