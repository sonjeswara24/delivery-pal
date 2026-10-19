# Driver location on order tracking

- Add a driver-location section beneath the tracking details only for orders marked **Out for delivery**.
- Show a clearly labelled sample driver location for the existing sample orders; do not imply real-time GPS tracking.
- Connect Google Maps to display that location on a map, with an unavailable state if the map cannot load.
- Keep the section hidden for ordered, packed, and delivered parcels.

## Technical details
- Keep this change on the customer tracking page, without adding logins or saved GPS updates.
- Add a small test for the status-based visibility rule and verify tracking searches for each status.
- Google Maps cannot be tested in this sandbox; validate its map on an authorized published domain.