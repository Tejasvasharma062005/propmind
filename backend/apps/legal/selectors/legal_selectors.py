def get_reports_for_property(property_id):
    return TitleSearchReport.objects.filter(property_id=property_id)
