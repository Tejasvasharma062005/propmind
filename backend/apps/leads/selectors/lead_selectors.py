# Leads selectors
def get_leads_for_agent(agent):
    return agent.assigned_leads.all()
