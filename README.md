# FlatMate frontend

A modern roommate-matching frontend and admin workspace built with React, TypeScript, Vite, and Tailwind CSS v4.

## Run locally

1. Set the backend URL in `.env`:

   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```

2. Install and start:

   ```bash
   npm install
   npm run dev
   ```

3. Open the URL shown by Vite. The backend must allow requests from that origin.

## Available flows

- Signup, login, and persisted JWT session
- Three-step profile onboarding
- Roommate discovery with configurable matching signals
- Personality assessments and trait results
- Spotify and Letterboxd identity/taste sync
- Editable profile, housing, and lifestyle preferences
- Admin algorithm controls, assessment question management, and role changes

Admin navigation is shown only when the authenticated JWT user has the `ADMIN` role.
