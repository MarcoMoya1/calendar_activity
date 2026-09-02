# Activity Calendar

A single-page calendar for logging daily activities. Opening the page shows the current month, highlights today, and lets you tap a day to mark Gym/Workout, Ran, Work, Rest Day, or a custom activity. Each activity has its own color; multiple activities on one day show as multiple color stripes.

## Data storage

Entries are saved in the browser with `localStorage`. Coming back on the same device and browser will still show previous days.

This is the simplest option for a personal Vercel site with no login. Data does **not** sync across phones/computers, and clearing site data will wipe the log. If you later want the same calendar on more than one device, we can add a tiny backend or a shared database.

## Local preview

Open `index.html` in a browser, or from this folder:

```bash
npx --yes serve .
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), import the GitHub repo.
3. Leave the defaults (static site, no build command) and deploy.
