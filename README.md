## Fortmont Web & Fortmont Webmail

### Requirements

- Mysql Server v8.0.0 or higher and open to 0.0.0.0 or LAN ip
- A mysql user with access for logon from any host
- A server with 2GB RAM and port 80 open for Fortmont Web
- A Azure free account or access to Microsoft Entra ID, with application, users and group creation permisssions (optional)
- A provisioned mailbox server (curently tested with mailcow) with IMAPS (tls)
- A reverse proxy pointing to the instance and port of Fortmont Web (used for secure cookie auth, required)



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

### Use the included Webui for viewing database entries

- Open {your_configured_url_in_reverse_proxy}/dashboard


### API documentation can be found in the [API Docs](./docs/api_usage.md)
















### Features to implement 
  - **lxc_ip verification to make sure it exists and updating lxc status if IP returns false**
  - **Addition of lxc hostname and service url to identify lxc purpose**
  - **Addition of lxc hardware information and vm host information**
  - **Automatic updating of service urls and status if in maintence mode or disabled**

