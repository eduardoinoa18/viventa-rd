# Feature Flags

## Social Feed

Control the social feed feature with environment variable:

```env
# .env.local
FEATURE_SOCIAL_ENABLED=false
```

- `false` or unset: Shows coming soon page with waitlist
- `true`: Shows full social feed with posts, likes, comments

This allows you to:
- Build and test the feature without exposing it to users
- Collect waitlist emails while the feature is in development
- Enable instantly when ready by changing one env var

## Usage in Code

```typescript
// Check if social is enabled
const socialEnabled = process.env.FEATURE_SOCIAL_ENABLED === 'true'

// In components
if (socialEnabled) {
  return <SocialFeed />
} else {
  return <SocialComingSoon />
}
```

## Deploying Feature Flags to Vercel

1. Go to Vercel dashboard → Settings → Environment Variables
2. Add `FEATURE_SOCIAL_ENABLED` with value `false` or `true`
3. Redeploy (no code changes needed)

## Future Flags

Add more feature flags as needed:
- `FEATURE_MESSAGING_ENABLED`
- `FEATURE_VIDEO_CALLS_ENABLED`
- `FEATURE_VIRTUAL_TOURS_ENABLED`
