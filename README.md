This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Requirements

- MYsql Server v8.0.0 or higher and open to 0.0.0.0 or LAN ip
- A mysql user with access for logon from any url
- A server with 2GB RAM and port 80 open for API server

### Pre-Install steps

- Install Prisman globally using `bash 
 pnpm install prisma -g 
 `

- Install package modules with your package manager

- Run ` pnpm exec prisma generate && pnpm exec prisma migrate dev --name init`

#### Note; Only run prisma migrate if you dont have a exisitng database with the included schema

### Run the development server:

```bash
pnpm run dev

```

### Use the included Webui for viewing database entries

- Open localhost:3000 (for dev) : lanip:80 (production)

### API routes implemented

- `/api/xc`
  - #### HTTP POST Requirements for creating/registering lxc's
    ````json
     {
        "lxc_ip": "10.0.0.1",
        "lxc_role": "mysql",
        "lxc_status": "disabled",
        "lxc_compose_status": "pending"
      }
       ```
    ````
  - #### HTTP GET endpoint

    `/api/lxc`
    - Optional params include lxc_ip, lxc_role, lxc_status, lxc_compose_status to filter by certain params

  - #### HTTP PATCH requrements
    - **Required** (params => lxc_unique_id) -> which ID you want to update, unique to the lxc and the role
    - **Required fields to update before updating files** (body => lxc_status **OR** lxc_compose_status) -> **Update** to maintance before editing any related files
    - **PATCH Json requirements** All fields are optional, dont need to include all->
      ```json
      {
        "lxc_ip": "10.0.0.1",
        "lxc_role": "mysql",
        "lxc_status": "disabled",
        "lxc_compose_status": "pending"
      }
      ```

### Features to cimplement 
  - **lxc_ip verification to make sure it exists and updating lxc status if IP returns false**
  - **Addition of lxc hostname and service url to identify lxc purpose**
  - **Addition of lxc hardware information and vm host information**
  - **Automatic updating of service urls and status if in maintence mode or disabled**

