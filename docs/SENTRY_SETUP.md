# Sentry Error Tracking Setup

This document describes how to complete the Sentry integration for production error tracking.

## Current Status

- Error tracking infrastructure is in place (`server/utils/errorTracking.ts`)
- Code is ready to use Sentry when configured
- Currently falls back to console logging when Sentry is not configured

## Setup Steps

### 1. Install Sentry Package

```bash
npm install @sentry/node
```

### 2. Create Sentry Project

1. Go to [https://sentry.io](https://sentry.io)
2. Create a new account or sign in
3. Create a new project
   - Platform: Node.js
   - Name: mortality-watch
4. Copy the DSN (Data Source Name) provided

### 3. Configure Environment Variables

Add to your `.env` file:

```env
SENTRY_DSN=your_sentry_dsn_here
```

For production, set this in your hosting environment (Vercel, Netlify, etc.)

### 4. Enable Sentry Integration

In `server/utils/errorTracking.ts`:

1. Uncomment the Sentry import at the top:

   ```typescript
   import * as Sentry from "@sentry/node";
   ```

2. Uncomment the `Sentry.init()` call in the `init()` method

3. Uncomment all Sentry method calls in:
   - `captureError()`
   - `captureMessage()`
   - `setUser()`
   - `clearUser()`

### 5. Test the Integration

#### Development Testing

```bash
# Set SENTRY_DSN in .env
npm run dev

# Trigger a test error (via API or UI)
curl http://localhost:3000/api/health
```

Check the Sentry dashboard to verify errors are being captured.

#### Production Testing

After deploying:

1. Monitor the Sentry dashboard for errors
2. Check that errors include proper context (request info, user data, etc.)
3. Verify sensitive data (auth headers, cookies) is filtered out

## Usage Examples

### Capturing Errors

```typescript
import { errorTracker } from "~/server/utils/errorTracking";

try {
  // Some operation that might fail
  await dangerousOperation();
} catch (error) {
  errorTracker.captureError(error as Error, {
    tags: { operation: "dangerous" },
    extra: { additionalInfo: "some context" },
  });
  throw error;
}
```

### Capturing Messages

```typescript
errorTracker.captureMessage("Important event occurred", "warning", {
  tags: { module: "chart-renderer" },
  extra: { chartType: "line" },
});
```

### Wrapping Handlers

```typescript
import { withErrorTracking } from "~/server/utils/errorTracking";

export default defineEventHandler(
  withErrorTracking(
    async (event) => {
      // Handler code
      return { success: true };
    },
    {
      tags: { handler: "api-health" },
    },
  ),
);
```

## Configuration Options

In `server/utils/errorTracking.ts`, you can adjust:

- **Environment**: Currently set to `process.env.NODE_ENV`
- **Sample Rate**: Currently 0.1 (10%) in production, 1.0 (100%) in dev
- **Enabled**: Only enabled in production by default
- **Data Filtering**: Filters out `authorization` and `cookie` headers

## Monitoring

Once configured, monitor:

1. **Sentry Dashboard**: https://sentry.io/organizations/your-org/issues/
2. **Error Rate**: Track error frequency and trends
3. **Performance**: Use Sentry's performance monitoring
4. **Alerts**: Configure alerts for critical errors

## Cost Considerations

Sentry pricing tiers:

- **Developer (Free)**: 5,000 events/month
- **Team ($26/month)**: 50,000 events/month
- **Business ($80/month)**: 100,000 events/month

Adjust `tracesSampleRate` to control volume if needed.

## Alternative: Disable Sentry

To use console logging only:

- Don't set `SENTRY_DSN` environment variable
- Errors will be logged to console/stdout only
- Still captured in server logs for debugging
