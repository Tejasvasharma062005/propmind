def get_negotiations_for_user(user):
    return user.buyer_negotiations.all()
