# Live Location Tracking & Distance-Based Sorting - Issues & Fixes

## Issues Identified

### 1. Live Location Tracking Not Accurate

**Problem:**

- The frontend (`pages/user.html` and `medifindApp/www/pages/user.html`) was polling the `/api/delivery-location` endpoint every 5 seconds.
- This endpoint is a **demo simulation** that returns a hardcoded `deliveryLocation` object, incrementing lat/lng by a fixed `0.0005` every 5 seconds.
- This endpoint is **not tied to any order ID** and does not reflect the actual delivery agent's GPS position from the database.
- Result: Users see a generic simulated movement instead of real agent tracking.

**Root Cause:**

- The app has proper tracking endpoints available (`/track/:orderId`, `/api/tracking?orderIds=...`) that fetch real delivery person GPS data from the `deliveries` table (`current_latitude`, `current_longitude`).
- But the UI was hardcoded to use the demo endpoint instead.

### 2. Pharmacy Distance Sorting Incorrect

**Problem:**

- Pharmacies not sorted by actual distance or sorted in random order.
- Backend and frontend both had potential issues:
  - **Backend** in `controllers/searchController.js`: used `lat && lng` check which fails if `lat` or `lng` is `0` (valid coordinate).
  - **Frontend** in `pages/user.html`: no validation that `latitude`/`longitude` are finite numbers; if a pharmacy record has missing/invalid coords, the distance calculation returns `NaN`, breaking the sort.

**Root Cause:**

- Truthy check (`lat && lng`) instead of proper type/range validation.
- Distance calculations did not filter out `NaN` and `Infinity` values.
- Invalid pharmacy coordinates (0, null, undefined, NaN) caused unpredictable sorting behavior.

---

## Fixes Applied

### Fix 1: Hardened Distance Calculations

**File: `controllers/searchController.js`**

- Replaced `const hasLocation = lat !== undefined && lat !== '' && ...` with:
  ```javascript
  const parsedLat = Number.parseFloat(lat);
  const parsedLng = Number.parseFloat(lng);
  const hasLocation = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);
  ```
- Added filter to remove invalid distances:
  ```javascript
  .filter((item) => Number.isFinite(item.distanceKm) && item.distanceKm <= parseFloat(radius))
  ```
- **Impact:** Now only pharmacies with valid, finite distances are returned and sorted correctly.

### Fix 2: Frontend Distance Validation

**Files: `pages/user.html` and `medifindApp/www/pages/user.html`**

- Updated `getDistance()` function to return `Infinity` if any coordinate is not finite:
  ```javascript
  function getDistance(lat1, lon1, lat2, lon2) {
    if (![lat1, lon1, lat2, lon2].every((v) => Number.isFinite(+v))) {
      return Infinity;
    }
    // ... haversine calculation ...
  }
  ```
- Filtered pharmacies before sorting:
  ```javascript
  const validPharmacies = pharmacies.filter(
    (p) => Number.isFinite(+p.latitude) && Number.isFinite(+p.longitude),
  );
  ```
- **Impact:** Invalid coordinates now produce `Infinity` distance, which naturally sorts to the end.

### Fix 3: Order-Specific Live Tracking

**Files: `pages/user.html` and `medifindApp/www/pages/user.html`**

- Modified polling interval to use the real tracking API when an order is active:

  ```javascript
  const orderIds = localStorage.getItem("currentOrderIds");
  if (orderIds) {
    const trackingRes = await fetch(
      `/api/tracking?orderIds=${encodeURIComponent(orderIds)}`,
    );
    if (trackingRes.ok) {
      data = await trackingRes.json();
    }
  }

  if (data && data.success) {
    const lat = data.agent?.lat ?? data.lat;
    const lng = data.agent?.lng ?? data.lng;
    if (lat != null && lng != null) {
      updateDeliveryMarker(lat, lng); // Use real DB data
      return;
    }
  }

  // Fallback to demo only if no order or API fails
  const demoData = await fetch("/api/delivery-location");
  ```

- **Impact:** Live tracking now shows real delivery agent position from database when an order is being tracked, with graceful fallback to demo for illustration.

---

## Testing Recommendations

1. **Verify Distance Sorting:**
   - Create/register pharmacies with valid and invalid coordinates (0, null, NaN).
   - Search for medicines or nearby pharmacies.
   - Confirm that only valid pharmacies appear and they are sorted by distance.

2. **Verify Live Tracking:**
   - Place an order and proceed to tracking page.
   - Verify that the agent marker moves based on real delivery data (if a delivery agent is assigned and updating position).
   - Check that `/api/tracking?orderIds=X` returns real agent location from the database.
   - If no order tracking data exists, the demo fallback should still work.

3. **Edge Cases:**
   - Test with latitude = 0 or longitude = 0 (should not be rejected).
   - Test with missing `currentOrderIds` (should fallback to demo).
   - Test with multiple orders (comma-separated IDs).

---

## Files Modified

1. `controllers/searchController.js` - Hardened distance validation in `searchMedicines()`, `aiSuggest()`, `getNearbyPharmacies()`
2. `pages/user.html` - Added coordinate validation in `getDistance()`, switched tracking to real API with demo fallback
3. `medifindApp/www/pages/user.html` - Same fixes as `pages/user.html`

---

## Related Endpoints

- **Real Tracking:** `/track/:orderId`, `/api/tracking?orderIds=...` (fetch from `deliveries` table)
- **Demo Tracking:** `/api/delivery-location` (in-memory simulation, for testing UI)
- **Nearby Pharmacies:** `/api/pharmacies/nearby?lat=X&lng=Y&radius=Z` (now with proper distance filtering)

---

## Notes

- The demo `/api/delivery-location` endpoint is still useful for UI testing when no real delivery data is available.
- All distance calculations now properly handle invalid/missing coordinates.
- The app gracefully degrades if real tracking data is unavailable (falls back to demo).
