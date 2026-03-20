# Mock profiles (for local development)

Location: public/mock/dummy_profiles.json  
Public URL (served by Next.js in dev/production): /mock/dummy_profiles.json

Purpose
- Provides 10 synthetic user profiles for the dashboard to display during development and QA.
- All data is clearly synthetic and safe to use in local/dev environments.

Quick usage example (browser / client-side)
To fetch and parse the profiles from the dashboard UI:

fetch('/mock/dummy_profiles.json')
  .then(res => {
    if (!res.ok) throw new Error('Failed to load mock profiles');
    return res.json();
  })
  .then(profiles => {
    console.log('Loaded mock profiles', profiles);
    // Use profiles array to render cards, lists or detail views
  })
  .catch(err => console.error(err));

Notes
- Photos reference placeholder URLs; the UI should show an internal placeholder when a photo fails to load or when the photos array is empty.
- IDs are unique (user_001 .. user_010). If you need more profiles, duplicate and update ids.
- If your dashboard caches the fetched file, clear browser cache or disable caching while developing.

### Optional
- To use a relative path for images instead of external placeholders, add image files under public/mock/photos/ and update photo URLs in the JSON accordingly.
