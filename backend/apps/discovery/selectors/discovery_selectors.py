# Discovery selectors
def get_user_favorites(user):
    return user.favorites.all()
