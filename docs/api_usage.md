### API routes implemented
  #### API routes are API_KEY protected, make sure to send x-api-key in header to use the API

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
-  ``` /api/registry```
