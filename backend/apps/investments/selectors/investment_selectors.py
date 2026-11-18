def get_open_pools():
    return InvestmentPool.objects.filter(status='OPEN')
