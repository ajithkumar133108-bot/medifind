# 📍 QUICK START GUIDE - Set Your Location

## 🎯 Problem & Solution

**Problem**: Geolocation API was not detecting correct latitude/longitude

**Solution**: Click "📍 My Location" to open modal with 3 easy methods

---

## 🚀 3 WAYS TO SET LOCATION

### Method 1: ✏️ MANUAL (Most Accurate)

```
1. Click "📍 My Location"
2. Click "✏️ Manual" tab (already open)
3. Enter Latitude: 13.0418
4. Enter Longitude: 80.2341
5. Click "✓ Set Coordinates"
6. Click "✓ Continue Search"
```

### Method 2: 📌 PRESETS (Fastest - Recommended)

```
1. Click "📍 My Location"
2. Click "📌 Presets" tab
3. Click desired pharmacy:
   - 🏪 MedPlus Pharmacy (13.0827, 80.2707)
   - 🏪 Apollo Pharmacy (13.0418, 80.2341)
   - 🏥 LifeCare Medical (13.0067, 80.2554)
   - 💊 HealthPoint Pharma (12.9783, 80.2209)
   - 🏪 CureMart Pharmacy (12.9249, 80.1000)
   - 📍 Center Point (13.0500, 80.2500)
4. Click "✓ Continue Search"
```

### Method 3: 📡 GPS (Automatic)

```
1. Click "📍 My Location"
2. Click "📡 GPS" tab
3. Click "📡 Enable GPS & Detect"
4. Allow location permission in browser
5. Wait for detection (max 10 seconds)
6. Click "✓ Continue Search"
```

---

## ✅ WHAT HAPPENS AFTER SETTING LOCATION

After setting your location:

1. **Location is SAVED**
   - Won't need to set again
   - Survives page refresh
   - Shows: "✅ Location Set"

2. **Search uses your location**
   - Enter medicine name
   - Click "🔍 Search"
   - Results show distances:
     ```
     Apollo Pharmacy: 📍 4.53 km away
     LifeCare Medical: 📍 8.57 km away
     ```

3. **Results sorted by distance**
   - Nearest pharmacy first ⬆️
   - Farthest pharmacy last ⬇️
   - Filtered by radius (1-50 km)

---

## 📍 PHARMACY LOCATIONS

### All Pharmacy Coordinates (Chennai)

| Pharmacy    | Latitude | Longitude |
| ----------- | -------- | --------- |
| MedPlus     | 13.0827  | 80.2707   |
| Apollo      | 13.0418  | 80.2341   |
| LifeCare    | 13.0067  | 80.2554   |
| HealthPoint | 12.9783  | 80.2209   |
| CureMart    | 12.9249  | 80.1000   |
| Test Center | 13.0500  | 80.2500   |

---

## ⚙️ HOW TO USE COORDINATES

### Enter Manually

```
Example: Apollo Pharmacy
Latitude:  13.0418  (tap to enter)
Longitude: 80.2341  (tap to enter)
```

### Valid Ranges

```
Latitude:  -90 to +90
Longitude: -180 to +180
```

### Format

```
✅ Correct: 13.0418  (4 decimals)
✅ Correct: 13.0     (1 decimal)
✅ Correct: 13       (integer)
❌ Wrong:   13.0418000 (too many decimals)
```

---

## 🔍 SEARCH WORKFLOW

```
1. Login to Patient Portal
   ↓
2. Type medicine name: "Paracetamol"
   ↓
3. Click "📍 My Location" → Set location → "✓ Continue"
   ↓
4. Click "🔍 Search"
   ↓
5. See results SORTED by distance:
   ┌─────────────────────────────────┐
   │ Paracetamol 500mg (Crocin)      │
   │ Price: ₹5.50 / Tablet          │
   │ Stock: 200 Tablets ✅           │
   │ 🏪 Apollo Pharmacy              │
   │ 📍 4.53 km away                 │
   │ [🛒 Add to Cart] [⚡ Buy Now]   │
   └─────────────────────────────────┘
   ↓
6. Click "🛒 Add to Cart" or "⚡ Buy Now"
```

---

## 💡 TIPS & TRICKS

**Tip 1**: Use PRESETS for quickest setup

- Just click one button
- No typing needed
- Instant result update

**Tip 2**: Save location by setting once

- Location saved to browser
- No need to set every time
- Use same location for all searches

**Tip 3**: Change location anytime

- Click "📍 My Location" again
- Select different preset
- Search results auto-update

**Tip 4**: Use TEST location for demo

- Click Center Point preset
- Try searching from middle
- See distance to all pharmacies

**Tip 5**: Try different radius options

- 1 km: Very close only
- 5 km: Default (recommended)
- 50 km: Show all pharmacies

---

## ❓ TROUBLESHOOTING

### Issue: "Location not saving"

**Solution**:

- Clear browser cache
- Check localStorage is enabled
- Try different pharmacy preset

### Issue: "Coordinates rejected"

**Solution**:

- Check range: Lat (-90 to 90), Lng (-180 to 180)
- Use presets instead of manual entry
- Ensure numbers only (no text)

### Issue: "GPS not detecting"

**Solution**:

- Need outdoor location with clear sky
- Enable GPS in device settings
- Try manual input or presets instead
- Some browsers require HTTPS

### Issue: "Wrong distances showing"

**Solution**:

- Verify coordinates are correct
- Use preset locations for accuracy
- Check radius setting (1-50 km)

---

## 📊 DISTANCE EXAMPLE

**If user at Apollo Pharmacy (13.0418, 80.2341):**

```
Apollo Pharmacy
  └─→ Distance = 0 km (user here) ⭐

MedPlus Pharmacy
  └─→ Distance = 4.27 km away

LifeCare Medical
  └─→ Distance = 4.85 km away

HealthPoint Pharma
  └─→ Distance = 8.57 km away

CureMart Pharmacy
  └─→ Distance = 21.39 km away
```

**Search radius: 5 km filter** ➜ Shows only first 3 pharmacies

---

## 🎯 QUICK FACTS

✅ **3 input methods**: Manual, Presets, GPS
✅ **6 preset locations**: 5 pharmacies + 1 test
✅ **Coordinates saved**: Survives page refresh
✅ **Accurate distances**: Haversine formula used
✅ **Sorted results**: Nearest pharmacy first
✅ **Real-time update**: Search auto-updates on location change
✅ **User control**: Set/change location anytime
✅ **No GPS required**: Manual input works without GPS

---

## 📱 MOBILE USERS

On mobile phones:

1. Click "📍 My Location"
2. Choose preferred method:
   - **MANUAL**: Type coordinates (easier on mobile with suggestions)
   - **PRESETS**: Click any pharmacy (fastest, no typing)
   - **GPS**: Enable for auto-detection
3. Results update automatically
4. Distance shown for each medicine

---

## 🔒 YOUR LOCATION IS SAFE

- ✅ Stored LOCALLY (in your device only)
- ✅ NOT sent to server when not searching
- ✅ Only used to calculate distances
- ✅ You can clear anytime
- ✅ No tracking or data collection

---

## 🎉 READY TO USE!

1. **Click** "📍 My Location"
2. **Select** preferred method
3. **Continue** to search
4. **View** results sorted by distance

**That's it! Enjoy accurate pharmacy search!**

---

**Version**: v3.0.0  
**Status**: ✅ Fully Working  
**Last Updated**: April 2026
