Tailwind note

- Tailwind CSS was added via the official CDN for quick prototyping by injecting the CDN script in app/layout.tsx.
- Files updated to use Tailwind utility classes:
  - app/layout.tsx (Tailwind CDN injection and body background)
  - app/login/page.tsx (styled login form; preserves existing fetch logic and Google sign-in)
  - app/register/page.tsx (styled register form; preserves existing register POST)
- No build config was modified. For production, it is recommended to install Tailwind as a dependency and add a compiled CSS input:
  1. npm install -D tailwindcss postcss autoprefixer
  2. npx tailwindcss init -p
  3. Configure tailwind.config.js and import the generated CSS in app/globals.css
  4. Remove the CDN script and build CSS during your Next.js build
