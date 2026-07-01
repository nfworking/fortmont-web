
# API Routes Reference Documentation Template

This document serves as a template and reference for the application's API endpoints. Each route listed below contains a structured outline for HTTP methods, request payloads, and expected behaviors. Customize the JSON payloads, descriptions, and methods as needed for your specific implementation. For a more in depth information about fields such as users and mailbox, please see [Database Schema](./schema.md)


---

## 🔐 Authentication Routes (`/api/auth/*`)

### 🔹 `/api/auth/entra-login`
- Used for Fortmont Mobile Authentication


---

### 🔹 `/api/auth/login`

* Used for Application Authentication (Only accepts POST requests from clients to update user information)

```
{
  "User_field":""
}

```


---

### 🔹 `/api/auth`

* Used for Application Authentication (Do not modify).
---

## 🧩 Platform API Routes (`/api/platform/*`)

All platform API routes require a valid API key in the `x-api-key` header or as a `Bearer` token in the `Authorization` header.
Keys are created and managed from `/platform/account` and are stored hashed in the database.

### 🔹 `/api/platform`

* **HTTP GET**
* *Description*: Returns platform-wide counts and storage totals from the database.

### 🔹 `/api/platform/users`

* **HTTP GET**
* *Description*: Returns a recent user list with account status and relation counts.

### 🔹 `/api/platform/apps`

* **HTTP GET**
* *Description*: Returns the platform app registry entries stored in the database.

### 🔹 `/api/platform/storage`

* **HTTP GET**
* *Description*: Returns per-user storage quotas and usage information.

### 🔹 `/api/platform/sessions`

* **HTTP GET**
* *Description*: Returns active database-backed user sessions.

### 🔹 `/api/platform/account/keys`

* **HTTP GET**
* *Description*: Lists the current user's configured API keys.
* **HTTP POST**
* *Description*: Creates a new API key and returns the plaintext key once.

### 🔹 `/api/platform/account/keys/:keyId`

* **HTTP DELETE**
* *Description*: Revokes a configured API key.

---

## 🌐 Network & Infrastructure Routes

### 🔹 `/api/dns`

* **HTTP POST Requirements**
```json
{
  "zone": "",
  "domain": "",
  "type": "",
  "ttl": 3600,
  "ipAddress": ""
}

```


* **HTTP GET**
* *Description*: List all dns records.
---

### 🔹 `/api/proxy`

* **HTTP GET**
* *Description*: Fetch active reverse proxy routing rules.
---

## 📬 Mailbox Management Routes

### 🔹 `/api/mailbox/create`

* **HTTP POST Requirements**
* It will retrive the current users authentication **Cookie** for authentication and creating link between mailbox db and server.

```json
{
    "email": "",
    "password": ""
}

```
---

### 🔹 `/api/mailbox`

* **HTTP GET**
* *Description*: Retrieve a list of all managed mailboxes.
---

## 🖥️ Proxmox Virtualization Routes

### 🔹 `/api/proxmox/hosts`

* **HTTP GET**
* *Description*: List clustered Proxmox hypervisor nodes and their hardware resource summaries.



---

### 🔹 `/api/proxmox/lxc`


* **HTTP GET**
* *Description*: List all LXC containers or query specific cluster details.



---

### 🔹 `/api/proxmox/resources`

* **HTTP GET**
* *Description*: Retrieve cluster-wide resource metrics including CPU, RAM, and Storage allocations.



---

## ⚙️ Core System & User Routes

### 🔹 `/api/realtime`

* **HTTP GET / WebSocket Upgrade**
* *Description*: Endpoint for realtime information for the Fortmont Mobile Application.



---

### 🔹 `/api/registry`

* **HTTP POST Requirements**
```json

    {
        "name": "",
        "version": "",
        "hosted_on": "",
        "server_url": ""
    }

```


* **HTTP GET**
* *Description*: List registered API servers.



---

### 🔹 `/api/users`

* **HTTP POST Requirements**
* **REQUIRES** API token to be sent as a **x-api-key** header
```json
{
  "username": "",
  "displayName": "",
  "email": "",
  "phone":"",
  "password":""
}

```


* **HTTP GET**
* *Description*: Query the system users.
