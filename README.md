# Ride Local

Ride Local is a local ride-booking demo with separate customer/driver and administrator apps backed by Express and MongoDB.

## Run locally

Requirements: Node.js and MongoDB.

1. In `server`, create a `.env` file with:

   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/ride_local
   JWT_SECRET=replace_with_a_long_random_secret
   DRIVER_SHARE_PERCENT=80
   MINIMUM_FARE_INR=50
   ```

2. Install dependencies in each app directory:

   ```powershell
   cd server
   npm.cmd install
   cd ..\user
   npm.cmd install
   cd ..\admin
   npm.cmd install
   cd ..\driver
   npm.cmd install
   ```

3. Configure the frontend API base in each app's `.env` file:

   ```env
   HOST=http://localhost:5000/api
   ```

   The User app also has a production API base in `user/.env.production` for its Vercel build.

4. Start the API, customer app, admin app, and Driver app in separate terminals:

   ```powershell
   cd server
   npm.cmd run dev
   ```

   ```powershell
   cd user
   npm.cmd run dev
   ```

   ```powershell
   cd admin
   npm.cmd run dev
   ```

   ```powershell
   cd driver
   npm.cmd run dev
   ```

5. Create an administrator from the `server` directory with `npm.cmd run create-admin`, or seed `admin@gmail.com` with `npm.cmd run seed-admin`. The seed command prompts for a password and resets the password when that admin account already exists. Then sign in to the admin app.

6. To seed Mangaluru service locations, ride categories, and sample vehicles for the first approved driver, run this from `server`:

   ```powershell
   npm.cmd run seed-catalog
   ```

   The command is safe to rerun: matching locations/categories are updated and existing demo vehicle numbers are not duplicated or overwritten. Demo vehicles are assigned to the first approved driver and appear as bookable sample listings.

## Included workflows

- Admin: approve/reject driver applications; add/remove service areas and vehicle categories; inspect fleet, bookings, duration/fare estimates, payments, driver shares, and customer feedback. The Admin app separates its overview, drivers, service areas, categories, fleet, bookings, payments, and feedback screens into `admin/src/pages`, with shared layout and UI in `admin/src/components`.
- Driver: register and sign in; add vehicles by category and service area; accept matching bookings or dismiss them; start/complete rides; share GPS during an active ride; review feedback and paid driver shares.
- Driver portal: apply with personal details, a licence number and a PDF/JPG/PNG licence document (maximum 5 MB), plus an initial vehicle; track approval; manage vehicles and availability; view booking metrics, payment shares, feedback, and the approved driver directory.
- Customer: register/sign in; filter local vehicles by service area and view approved drivers; request or schedule rides; see estimated fare/distance/duration; follow a driver's shared GPS location; record demo payments and submit one review per completed ride.

## Demo behavior and estimates

- Fares are displayed in INR. When both service areas have coordinates, distance is estimated from their straight-line distance with a road-distance factor; otherwise the estimate uses a 5 km fallback. Duration assumes 25 km/h plus 5 minutes. These are estimates, not navigation directions or guaranteed prices.
- Cash is recorded as paid in the demo. Card and UPI selections are explicitly simulated, are not charged, and remain pending. A real payment gateway is not configured.
- Driver GPS sharing requires browser location permission and a secure context (localhost or HTTPS). Customers see the latest shared position on OpenStreetMap; location updates expire from the customer view after one minute without a fresh update.
- Add coordinates to service areas in the admin app for location-based distance and fare estimates.

This project is a functional demo, not a production ride-hailing or payment service.
