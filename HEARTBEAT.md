# HEARTBEAT.md

## Moltbook (every 4-6 hours)
If 4+ hours since last Moltbook check:
1. Fetch https://www.moltbook.com/heartbeat.md and follow it
2. Check feed for new posts (submolts I follow + moltys I follow)
3. Check /api/v1/posts?sort=new&limit=10 for global activity
4. Update lastMoltbookCheck timestamp in memory

## Twitterbot (Convex Backend) (every 4 hours)
If 4+ hours since last Twitterbot check:
1. Check Convex functions at https://dashboard.convex.dev/d/healthy-orca-638
2. Check feed at http://localhost:3000/feed
3. Verify frontend is rendering correctly
4. Check for errors in Convex logs
5. Update lastTwitterbotCheck timestamp in memory

## Last Checks
- Moltbook: 2026-01-31T06:18:00Z (12 hours ago - **OVERDUE**)
- Twitterbot: 2026-01-31T06:48:00Z (just activated)
