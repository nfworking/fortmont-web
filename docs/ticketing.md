## Fortmont Tickting and Workflows

### Recently a new intergrated ticketing platform was created inside Fortmont Web. This is going to be developed as a similar clone to ServiceNow, complete with request forms, kba and admin dashboard. 

#### Current features that have been implemented include: 

- Basic ticket creation and editing
- Basic admin dashboard with tickets overview
- Incomplete KBA docs page, not completed yet as ticket dashboard was being developed
- Dynamic patch API routes, dynamic filters with avaiable types, departments, etc
- kba GET and POST route implemented
- ticket GET, POST, PATCH routes implemented

### Features to still implement 

- Comments and audit trail features for ticketing and kba events
- Automation based tickets, with base automation engine, N8N
- Email sending on ticket status changes, new comments, and assigned using N8N
- Team creation such as NOC, SOC and other teams like channels, maybe a actual teams like interface as a seperate application**
- RBAC for admin and ticket pages, so that only admins see ticket dashboard, where as users, can only create tickets, and view tickets under their name*


## Tehcnologies that need to be implemented
- Automation engine*** (Currently going to use N8N)
- .env seperation for ticketing sub-app vs main app
- API key usage if going to implement teams like sub-app**
