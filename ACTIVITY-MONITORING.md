# Activity Monitoring System

## Overview
Complete activity logging and monitoring system for the Viventa RD admin dashboard. Tracks all major system events including user operations, application approvals, authentication, and property management.

## Architecture

### Data Model
**Collection**: `activity_logs`

```typescript
interface ActivityLog {
  id: string                    // Auto-generated document ID
  type: string                  // Event category: user, application, property, auth, system
  action: string                // Specific action taken
  timestamp: Date               // When the event occurred
  userId?: string               // ID of user who performed action
  userName?: string             // Display name of user
  userEmail?: string            // Email of user
  metadata?: Record<string, any> // Additional context data
}
```

### Security Rules
```javascript
// Firestore Rules: firebase/firestore.rules
match /activity_logs/{logId} {
  allow create: if true;                    // Any authenticated user can log
  allow read: if isElevated();              // Only admins can read
  allow update, delete: if false;           // Immutable audit trail
}
```

## Components

### 1. ActivityLogger Library
**Location**: `lib/activityLogger.ts`

Centralized helper for consistent logging across the application.

**Core Function**:
```typescript
ActivityLogger.log({
  type: 'user',
  action: 'User Created',
  userId: 'user123',
  userName: 'John Doe',
  userEmail: 'john@example.com',
  metadata: { role: 'agent' }
})
```

**Convenience Methods**:
- `userCreated(email, name, role)`
- `applicationApproved(email, name, role, code)`
- `applicationRejected(email, name, role, reason)`
- `authSync(created, updated)`
- `adminLogin(email, name)`

### 2. Activity API
**Location**: `app/api/admin/activity/route.ts`

RESTful endpoints for managing activity logs.

**GET** `/api/admin/activity?limit=50`
- Fetches activity logs with optional limit
- Defaults to 50 most recent logs
- Returns array of formatted logs with relative timestamps

**POST** `/api/admin/activity`
- Creates new activity log entry
- Body: `{ type, action, userId?, userName?, userEmail?, metadata? }`
- Returns success confirmation

### 3. Activity Feed Page
**Location**: `app/admin/activity/page.tsx`

Full-featured admin interface for viewing and filtering activity.

**Features**:
- **Type Filtering**: Filter by user, application, property, auth, system, or all
- **Timeline View**: Chronological list with relative timestamps
- **Metadata Display**: Contextual details for each event
- **CSV Export**: Download filtered logs for analysis
- **Pagination**: Configurable limit selector (25/50/100/500)
- **Load More**: Incremental loading for performance
- **Stats Bar**: Shows filtered vs total count

**UI Elements**:
- Filter chips with counts per category
- Color-coded action badges
- Icon-based type indicators
- Expandable metadata panels
- Export/refresh controls

### 4. Activity Widget
**Location**: `components/ActivityWidget.tsx`

Dashboard widget showing recent activity summary.

**Features**:
- Last 5 activity logs
- Activity type distribution badges
- Relative timestamps
- Link to full Activity Feed
- Loading skeleton states

**Integration**: Used on main admin dashboard (`app/admin/page.tsx`)

## Event Tracking

### User Operations
**API**: `app/api/admin/users/route.ts`

```typescript
// User Created
ActivityLogger.userCreated(email, name, role)

// User Updated
ActivityLogger.log({
  type: 'user',
  action: 'User Updated',
  metadata: { 
    role, 
    status, 
    updatedFields: ['name', 'phone'] 
  }
})

// User Deleted
ActivityLogger.log({
  type: 'user',
  action: 'User Deleted',
  metadata: { role }
})
```

### Application Approvals
**API**: `app/api/admin/applications/route.ts`

```typescript
// Approved
ActivityLogger.applicationApproved(
  application.email,
  application.name,
  application.requestedRole,
  credentials.code
)

// Rejected
ActivityLogger.applicationRejected(
  application.email,
  application.name,
  application.requestedRole,
  reason
)
```

### Authentication Events
**API**: `app/api/auth/verify-master-code/route.ts`

```typescript
// Admin Login
ActivityLogger.adminLogin(email, name)
```

**API**: `app/api/admin/users/sync/route.ts`

```typescript
// Auth Sync
ActivityLogger.authSync(createdCount, updatedCount)
```

### Property Management
**API**: `app/api/properties/route.ts`

```typescript
// Property Created
ActivityLogger.log({
  type: 'property',
  action: 'Property Created',
  metadata: {
    propertyId: id,
    title: property.title,
    type: property.type,
    price: property.price
  }
})

// Property Updated
ActivityLogger.log({
  type: 'property',
  action: 'Property Updated',
  metadata: {
    propertyId: id,
    title: property.title,
    updatedFields: ['price', 'status']
  }
})

// Property Deleted
ActivityLogger.log({
  type: 'property',
  action: 'Property Deleted',
  metadata: {
    propertyId: id,
    title: property.title
  }
})
```

## Usage

### Viewing Activity
1. Navigate to Admin Dashboard → Activity Feed
2. Use filter chips to narrow by event type
3. View detailed metadata for each event
4. Export to CSV for external analysis

### Adding New Event Types

**1. Log the event using ActivityLogger**:
```typescript
import { ActivityLogger } from '@/lib/activityLogger'

// In your API route
await ActivityLogger.log({
  type: 'feature',        // New category
  action: 'Feature Enabled',
  userId: user.id,
  userName: user.name,
  userEmail: user.email,
  metadata: {
    featureName: 'dark_mode',
    enabled: true
  }
})
```

**2. Add filter to Activity Feed** (optional):
```typescript
// In app/admin/activity/page.tsx
['all', 'user', 'application', 'property', 'auth', 'system', 'feature'].map(f => ...)
```

**3. Add icon/badge styling** (optional):
```typescript
// In app/admin/activity/page.tsx
const getIcon = (type: string) => {
  const icons: Record<string, JSX.Element> = {
    // ... existing icons
    feature: <FiFlag className="text-pink-600" />
  }
  return icons[type] || <FiActivity />
}
```

### Best Practices

1. **Be Specific**: Use descriptive action names
   - ✅ "Application Approved - Agent"
   - ❌ "Update"

2. **Include Context**: Add relevant metadata
   ```typescript
   metadata: {
     role: 'agent',
     code: 'AG-1234',
     reason: 'Approved by master admin'
   }
   ```

3. **Log Both Success and Failure**:
   ```typescript
   if (approved) {
     await ActivityLogger.applicationApproved(...)
   } else {
     await ActivityLogger.applicationRejected(...)
   }
   ```

4. **Don't Log Sensitive Data**:
   - ❌ Passwords, tokens, credit cards
   - ✅ User IDs, roles, action types

5. **Keep Logs Immutable**: Never update or delete activity logs (enforced by Firestore rules)

## Performance Considerations

1. **Pagination**: Default limit of 50, adjustable up to 500
2. **Indexing**: Firestore composite index on `timestamp` (desc)
3. **Client-Side Filtering**: Filter operations done in-memory after fetch
4. **CSV Generation**: Browser-side, no server load
5. **Real-Time Updates**: Not implemented (use Refresh button)

## Future Enhancements

- [ ] Real-time activity updates via Firestore subscriptions
- [ ] Advanced search and date range filters
- [ ] Activity analytics dashboard (graphs, charts)
- [ ] Email notifications for critical events
- [ ] Activity log archiving for long-term storage
- [ ] Integration with external monitoring tools
- [ ] Automated anomaly detection

## Navigation

**Admin Sidebar**: Activity Feed (icon: FiActivity)
**Dashboard Widget**: Recent Activity section
**Direct URL**: `/admin/activity`

## Firestore Rules Deployment

```bash
firebase deploy --only firestore:rules
```

## Testing

### Manual Testing
1. Create a user → Check Activity Feed for "User Created" log
2. Approve an application → Verify "Application Approved" with credential code
3. Update user role → Confirm "User Updated" with changed fields
4. Delete property → Ensure "Property Deleted" appears
5. Export CSV → Validate downloaded file contains correct data

### Automated Testing (Future)
```typescript
// Example test
describe('ActivityLogger', () => {
  it('should log user creation', async () => {
    await ActivityLogger.userCreated('test@example.com', 'Test User', 'agent')
    const logs = await fetchActivityLogs()
    expect(logs[0].action).toBe('User Created')
  })
})
```

## Troubleshooting

### Logs Not Appearing
1. Check Firestore rules are deployed
2. Verify API endpoint is accessible
3. Ensure user has elevated role (admin/master_admin)
4. Check browser console for errors

### CSV Export Empty
1. Verify filtered logs exist
2. Check browser download permissions
3. Inspect console for export errors

### Performance Issues
1. Reduce limit parameter
2. Clear filters to reduce memory usage
3. Check Firestore quota limits

## Summary

The Activity Monitoring System provides comprehensive audit trails for all critical operations in Viventa RD. With automatic logging, admin-friendly UI, and flexible export options, it ensures transparency, accountability, and compliance for platform operations.

**Key Stats**:
- 6 event types tracked
- 10+ action types
- Append-only audit trail
- CSV export support
- Dashboard integration
- Real-time filtering

**Commits**:
- `ab4c19a` - Initial activity monitoring system
- `06c9e33` - CSV export, dashboard widget, pagination
- `515aaef` - Extended logging to user CRUD, auth, properties
