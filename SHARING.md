# 🔗 Snapshot Sharing Feature

## Overview

The TimeTracker Analytics app now supports sharing complete snapshots of your analysis including all data, settings, and current state through Appwrite integration.

## Features

### 📸 Complete State Snapshots
- **Time Entries**: All your timesheet data
- **Settings**: Hourly rates, rounding intervals, filters
- **UI State**: Current view (dashboard/analytics/invoice)
- **Invoice Configuration**: Client details, company info, rates

### 🔗 Shareable Links
- Generate permanent, shareable URLs
- Links contain complete app state
- Anyone with the link can view the exact same analysis
- No account required to view shared snapshots

## How to Use

### 1. Sharing from Dashboard
1. Import your timesheet data
2. Apply any filters or settings you want
3. Click the **"Share"** button in the top toolbar
4. Add an optional title and description
5. Click **"Generate Shareable Link"**
6. Copy and share the generated URL

### 2. Sharing from Invoice Generator
1. Configure your invoice with client details
2. Set up company information and rates
3. Click the **"Share"** button in the invoice actions
4. The snapshot will include all invoice settings
5. Share the generated link

### 3. Loading Shared Snapshots
- Simply open the shared URL
- The app will automatically load all data and settings
- Everything will appear exactly as the sharer configured it

## URL Structure

Shared snapshots use this URL pattern:
```
https://your-app.com/?snapshot=abc123def456
```

## Setup Requirements

### 1. Appwrite Configuration
1. Create an [Appwrite Cloud](https://cloud.appwrite.io) account
2. Create a new project
3. Copy your Project ID
4. Add environment variables:
   ```bash
   VITE_APPWRITE_PROJECT_ID=your-project-id
   VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   ```

### 2. Database Setup
The app automatically creates:
- Database: `timetracker-snapshots`
- Collection: `snapshots`

No manual setup required!

## Data Structure

Each snapshot contains:
```json
{
  "title": "My Analysis - 12/25/2025",
  "description": "Q4 timesheet analysis",
  "timeEntries": [...],
  "defaultHourlyRate": 75,
  "defaultRoundingInterval": 60,
  "currentFilters": {...},
  "activeView": "dashboard",
  "invoiceState": {...},
  "uiState": {...}
}
```

## Privacy & Security

- Snapshots are stored in your Appwrite database
- Links are publicly accessible (anyone with URL can view)
- No user authentication required for viewing
- Consider data sensitivity before sharing
- Snapshots persist until manually deleted

## Limitations

- Requires internet connection for sharing/loading
- Appwrite service availability dependent
- Large datasets may have slower loading times
- No built-in snapshot management UI (use Appwrite console)

## Troubleshooting

### "Failed to create shareable link"
- Check your Appwrite configuration
- Verify PROJECT_ID is correct
- Ensure internet connectivity

### "Failed to load snapshot"
- Link may be invalid or expired
- Check Appwrite service status
- Try refreshing the page

### "Loading snapshot..." hangs
- Check network connection
- Verify Appwrite endpoint URL
- Clear browser cache and try again

## Development

For local development with sharing:
1. Set up Appwrite project
2. Configure environment variables
3. Database/collection created automatically on first share
4. Test with `npm run dev`

## API Reference

### SnapshotService Methods
- `saveSnapshot(snapshot)` - Save to Appwrite
- `loadSnapshot(id)` - Load from Appwrite  
- `createSnapshot(data, settings, options)` - Create snapshot object
- `generateShareableUrl(id)` - Generate share URL
- `getSnapshotIdFromUrl()` - Extract ID from URL

---

**Note**: This feature requires an active Appwrite project. See the main README for complete setup instructions.
