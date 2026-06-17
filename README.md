# Delta Kebab - Frontend

This folder contains a production-ready Angular 22 standalone-component application skeleton for the Delta Kebab landing page.

Quick start:

1. Install dependencies:

```bash
cd delta-fe
npm install
```

2. Run dev server:

```bash
npm start
```

Notes:
- Translations are in `src/assets/i18n/` and are loaded at runtime via `@ngx-translate`.
- Branch data is in `src/assets/data/branches.json`.
- Geolocation and Haversine distance calculation run entirely client-side.
