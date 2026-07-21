# Ticketing

Fortmont includes a built-in ticketing module that uses the main auth and user schema. Tickets, comments, teams, and KB articles are all stored in Prisma and are exposed through dedicated routes under `app/api/ticketing`.

## Current capabilities

- Create and list tickets from the main app.
- Update existing tickets and assign them to users or teams.
- Add comments to tickets.
- Load ticketing form metadata and user selectors.
- Stream ticket updates over Redis-backed event routes.
- Notify assignees through email, in-app notifications, and device notifications.

## Data model

The ticketing module uses these core models:

- `Tickets` for the ticket record itself.
- `Comment` for ticket discussion threads.
- `Team` for group assignment and membership.
- `KbArticle` for knowledge base content.
- `AppUsers` for creators, assignees, authors, and team members.

The current ticket priority enum is `LOW`, `MEDIUM`, `HIGH`, and `URGENT`.

## API surface

- `/api/ticketing/post/ticket`: List or create tickets.
- `/api/ticketing/get/ticket`: Read a ticket record.
- `/api/ticketing/patch/ticket/:id`: Edit a ticket.
- `/api/ticketing/patch/assign/team`: Assign a ticket to a team.
- `/api/ticketing/post/ticket/:ticketId/comments`: Add a comment.
- `/api/ticketing/post/ticket/form`: Fetch or submit ticket form data.
- `/api/ticketing/get/users`: List users for assignment selectors.
- `/api/ticketing/stream/tickets/:ticketId/stream`: Stream live ticket activity.

## What is still evolving

- More complete audit trails and history views.
- Better automation around routing, classification, and status transitions.
- Stronger admin and role-based access controls.
- A richer knowledge base authoring and search experience.

## Practical note

Ticketing is already integrated with the rest of the platform, so changes to auth, notifications, storage, or user records can affect it directly. When you change one of those shared systems, check the ticketing routes and UI together.
