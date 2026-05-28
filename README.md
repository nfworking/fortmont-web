

### Requirements

- MYsql Server v8.0.0 or higher and open to 0.0.0.0 or LAN ip
- A mysql user with access for logon from any url
- A server with 2GB RAM and port 80 open for API server
- A Azure free account or access to Microsoft Entra ID, with application, users and group creation permisssions


### Pre-Install steps

- Install Prisman globally using `bash 
 pnpm install prisma -g 
 `

- Install package modules with your package manager

- Run ```cp .example.env .env``` and use the example to fill in your own .env (for all env variable usage, see [env.md](./docs/env.md))

- Run ` pnpm exec prisma generate && pnpm exec prisma migrate dev --name init`

#### Note; Only run prisma migrate if you dont have a exisitng database with the included schema

### Run the development server:

```bash
pnpm run dev

```

### Use the included Webui for viewing database entries

- Open localhost:3000 (for dev) : lanip:80 (production)


### Usage for the api routes and instructions can be found in [api-usage.md](./docs/api_usage.md)
















### Features to cimplement 
  - **lxc_ip verification to make sure it exists and updating lxc status if IP returns false**
  - **Addition of lxc hostname and service url to identify lxc purpose**
  - **Addition of lxc hardware information and vm host information**
  - **Automatic updating of service urls and status if in maintence mode or disabled**

