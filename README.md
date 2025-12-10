This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Firebase

This project is connected to the **tadpole** Firebase project (Project ID: `tadpole-43fab`).

### Firestore Database Structure

The application uses a Firestore database with the following structure:

#### `users` Collection

The `users` collection stores user information. Each user document contains:

- `email` (string): User's email address
- `name` (string, optional): User's name
- `createdAt` (timestamp): When the user document was created
- `updatedAt` (timestamp): When the user document was last updated

#### `days` Subcollection

Each user document has a `days` subcollection that stores daily activity records. Each day document:

- **Document ID**: Date string in format `YYYY-MM-DD` (e.g., `2024-01-15`)
- **Fields**:
  - `date` (timestamp): The date this day represents
  - `events` (array): List of activities/events recorded for this day
  - `createdAt` (timestamp, optional): When the day document was created
  - `updatedAt` (timestamp, optional): When the day document was last updated

#### `events` Array

Each day document contains an `events` array with activity objects. Each event has:

- `id` (string): Unique identifier for the event
- `name` (string): Name of the activity (e.g., "pushups", "running")
- `quantity` (string, optional): Quantity of the activity
- `unit` (string, optional): Unit of measurement (e.g., "reps", "minutes", "miles")
- `timestamp` (timestamp): When the activity was recorded

#### Example Structure

```
users/
  └── {userId}/
      ├── email: "user@example.com"
      ├── name: "John Doe"
      ├── createdAt: Timestamp
      ├── updatedAt: Timestamp
      └── days/ (subcollection)
          └── "2024-01-15"/
              ├── date: Timestamp
              ├── events: [
              │     {
              │       id: "event1",
              │       name: "pushups",
              │       quantity: "50",
              │       unit: "reps",
              │       timestamp: Timestamp
              │     },
              │     {
              │       id: "event2",
              │       name: "running",
              │       quantity: "5",
              │       unit: "miles",
              │       timestamp: Timestamp
              │     }
              │   ]
              ├── createdAt: Timestamp
              └── updatedAt: Timestamp
```

### Utility Functions

The project includes utility functions for working with the Firestore structure:

- **User operations**: `src/lib/users.ts` - Functions for creating, reading, updating, and deleting users
- **Day operations**: `src/lib/days.ts` - Functions for working with days and events:
  - `getDayByDate()` - Get a specific day for a user
  - `getAllDays()` - Get all days for a user
  - `createOrUpdateDay()` - Create or update a day document
  - `addEventToDay()` - Add an activity/event to a day
  - `removeEventFromDay()` - Remove an activity/event from a day

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
