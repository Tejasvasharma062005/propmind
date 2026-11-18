def get_locality_trends(city='Indore'):
    return LocalityTrend.objects.filter(city__iexact=city)
