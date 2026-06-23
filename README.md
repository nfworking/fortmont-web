## Fortmont Web & Fortmont Webmail

### Overview and Overhaul

Fortmont Web is designed to be a central control plane for a homelab instance, it would connect to local or remote homelab services collecting data from http endpoints, which would display as a dashboard for the homelab. The current state and version of the project is still in early development. Most of the features have not been tested for errors or bugs, however bugs are being fixed as they are discovered. The current UI of the application is close to being consistent, however big improvements can be made to make it better. The application also does not currently have any user defined values, which would make it hard for multi instance deployment. Further development will include the ability to interact with the proxmox api, the mail api, the github api and many of the other API's that were implemented in the project. Within the progress that has been made, it can be determined that V3.0.0 will introduce big changes, including to the auth system, the ui and layout as well as the ability to interact with the API's.


#### UI: The current UI does feature a blur interface, but this might change in future versions, removing the need for blur fuctionality. Eventually it will move to a more user defined function rather than baked into the code. 

#### API: The Api will most likely be moved to a more central platform, where it will become a more managed instance. Currently the API is baked into the application, making it difficult for migration at this time. The API moving forward will become more modular and will be under the new prefix /api/${app.version}json route, rather than the previous /api routes. It will also become more managed, allowing the selection for controlling entries in the API routes, as well as adding a authentication layer to it, protecting any sensitive information the route may return


#### Auth: The auth system may go through a security overhaul moving the static cookie system with no session revocation to a more or cookie version management system. This will improve application security and improve the ability for users to trust the platform

#### Ticketing: The ticketing system will undergo a huge overhaul once all features are implemented. It will feature a more workflow based ui and interface, allowing users to be seperated from administrators. It will again feature RBAC, live comments and other features. It will also undergo a security overhaul, making sure that the application becomes more secure not allowing unauthorized users from accesing its interface. 

### Requirements

- A database server, preferably mysql with a user able to access from remote connections
- A Microsoft Entra ID tenant if you wish to add entra ID authentication to the platform
- A Github O-Auth application for intergration with live github account stats
- A provisioned Mail server that uses tls (preferred) avaiable on the network
- A DNS server with HTTP REST capability for getting dns server records as well as the ability to create them
- A Reverse proxy server with a HTTP REST endpoint for retriving proxy server records
- A proxmox server as it the application primarly uses it for statistics and platform stats.



### Pre-Install steps

- Install Prisman globally using `bash 
 pnpm install prisma -g 
 `

- Install package modules with your package manager

- Run ```cp .example.env .env``` and use the example to fill in your own .env (for env variable usage, see [ENV](./docs/env.md))

- Run ` pnpm exec prisma generate && pnpm exec prisma migrate dev --name init`

#### Note; Only run prisma migrate if you dont have a exisitng database with the included schema

### Run the development server:

```bash
pnpm run dev

```



### API documentation can be found in the [API Docs](./docs/api_usage.md)


### Current Major features and future features
- Ticket dashboard
- KBA docs
- Admin homelab dashboard with different tabs
- Apps page to show homelab services
- Login page with device login notifications

### Features in progress
- Fully featured ticket dashboard (Current: Im Progress)
- Central account & profile center for both ticket and main app users (Current: Planning)
- Added database entry for users with api keys, jobs, workflows, access, roles, etc (Future: Initial Stage)

### AI usage Information:
This project was developed by a human developer with assistance from AI tools, primarily GitHub Copilot. The user interface was created using a combination of publicly available design templates, inspiration from the developer's own concepts, and components inspired by Shadcn UI.

AI assistance was used to help adapt and convert interface designs into React Native-compatible implementations. All application logic, architecture, and functionality were designed, reviewed, and validated by the developer. AI-generated code was subject to human review before inclusion in the project.

AI was primarily used as a development aid for tasks such as code suggestions, troubleshooting, and assistance with complex implementation challenges. Final decisions regarding design, functionality, and code quality remained under the developer's control throughout the project.

### Images and Video resources

This project contains images and videos that are free for use from pexels and unsplash. If you see your content, and would like for me to reference it, let me know!
