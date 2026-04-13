# Internationalization (i18n) Setup Guide

## Overview
This project now supports English and Spanish localization with language-prefixed routing.

## Structure

### Locale Routing
- **English (default):** `/` and `/en/` routes (no prefix required)
- **Spanish:** `/es/` prefix for all routes

### Example URLs
- Home (EN): `/` or `/en/`
- Home (ES): `/es/`
- Services (EN): `/services` or `/en/services`
- Services (ES): `/es/services`
- Blog (EN): `/blog` or `/en/blog`
- Blog (ES): `/es/blog`
- Contact (EN): `/contact` or `/en/contact`
- Contact (ES): `/es/contact`

## File Structure

```
src/
├── i18n/
│   ├── en.json              # English translations
│   ├── es.json              # Spanish translations
│   └── utils.ts             # i18n utility functions
├── components/
│   ├── Navigation.astro     # i18n-aware navigation
│   └── LanguageSwitcher.astro  # Language toggle component
├── pages/
│   ├── index.astro          # English home page
│   ├── services.astro       # English services
│   ├── blog.astro           # English blog
│   ├── contact.astro        # English contact
│   └── es/
│       ├── index.astro      # Spanish home page
│       ├── services.astro   # Spanish services
│       ├── blog.astro       # Spanish blog
│       ├── contact.astro    # Spanish contact
│       └── blog/
│           └── [slug].astro # Spanish blog detail pages
└── layouts/
    └── Layout.astro         # Updated with locale support
```

## Configuration

### Astro Config (`astro.config.mjs`)
```javascript
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'es'],
  routing: {
    prefixDefaultLocale: false,  // English doesn't need /en/ prefix
  },
}
```

## Usage

### In Components/Pages
```astro
---
import { useTranslations } from '../i18n/utils';

const locale = 'en'; // or 'es'
const t = useTranslations(locale);
---

<h1>{t.home.headline}</h1>
<p>{t.home.subheadline}</p>
```

### Accessing Translations
All translations are organized hierarchically in JSON files:

**English translations** (`src/i18n/en.json`):
```json
{
  "nav": {
    "home": "Home",
    "services": "Services",
    "blog": "Blog",
    "contact": "Contact"
  },
  "home": {
    "headline": "Engineering the Digital Horizon",
    "subheadline": "...",
    "cta": "Explore Our Services"
  }
}
```

**Spanish translations** (`src/i18n/es.json`):
```json
{
  "nav": {
    "home": "Inicio",
    "services": "Servicios",
    "blog": "Blog",
    "contact": "Contacto"
  }
}
```

### Navigation Component
The `<Navigation />` component automatically handles locale-aware links:

```astro
<Navigation locale={locale} />
```

### Language Switcher
The `<LanguageSwitcher />` component appears in the navigation and allows users to toggle between languages:

```astro
<LanguageSwitcher currentUrl={Astro.url} />
```

## Adding Translations

1. **Add English translation** in `src/i18n/en.json`
2. **Add Spanish translation** in `src/i18n/es.json`
3. **Use in pages:**
   ```astro
   const t = useTranslations(locale);
   <element>{t.section.key}</element>
   ```

## Utility Functions (`src/i18n/utils.ts`)

- `useTranslations(locale)` - Get translation object for a locale
- `getTranslations(locale)` - Alternative method to get translations
- `getLangFromUrl(url)` - Extract locale from URL
- `getLocalePath(pathname, locale)` - Build locale-aware URL
- `getAlternateLocale(locale)` - Get the opposite locale
- `getLocaleFromUrl(url)` - Get current locale from URL

## Blog Posts with i18n

Currently, blog content uses the same Markdown files for both languages. To create language-specific blog posts:

1. **Current approach:** Use English blog files visible in both `/blog` and `/es/blog`
2. **Future enhancement:** Create separate `content/blog/en/` and `content/blog/es/` directories for language-specific content

## Testing

### Install Dependencies
```bash
pnpm install
```

### Run Development Server
```bash
pnpm dev
```

### Check Routes
- Visit `http://localhost:3000/` (English home)
- Visit `http://localhost:3000/es/` (Spanish home)
- Use the language switcher in the top right to toggle between languages

## SEO Considerations

Each locale has proper language attributes:
- English pages: `<html lang="en">`
- Spanish pages: `<html lang="es">`

## Future Enhancements

1. **Language-specific blog content** - Separate blog posts for each language
2. **Metadata translations** - Translate page meta descriptions and titles
3. **Date formatting** - Proper localized date formats
4. **Cookie preference** - Remember user's language preference
5. **Automatic redirects** - Redirect by browser language preference
6. **More languages** - Add French, Portuguese, etc.

## Common Issues

### Missing translations
If a key doesn't exist, it will be `undefined`. Always ensure both `en.json` and `es.json` have matching keys.

### Locale detection
Routes are automatically matched to locales. Ensure pages are in correct directories:
- English: `src/pages/*.astro`
- Spanish: `src/pages/es/*.astro`

## Notes

- The language switcher maintains the current page path (e.g., `/services` ↔ `/es/services`)
- Navigation links automatically adjust based on locale
- All pages must explicitly set their locale in frontmatter
- Translations are loaded at build time for optimal performance
