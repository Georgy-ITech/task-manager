# Task Flow

Task Flow is a portfolio-ready task manager focused on clean UI, smooth motion, and practical productivity workflows.

## Live Demo

Add your deployed URL here after publishing:

- `https://your-demo-url.vercel.app`

## Features

- Create, edit, complete, and delete tasks
- Task priority and deadline support
- Filters: all, active, completed
- Sort modes: newest, oldest, priority, deadline
- Debounced search
- Local persistence with `localStorage`
- Custom animated priority dropdown
- Custom date picker with month navigation
- Empty-state illustration and polished micro-interactions

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript

## Project Structure

```text
task-flow/
  index.html
  404.html
  assets/
    icons/
      favicon.svg
    og/
      og-image.svg
    screenshots/
      .gitkeep
  src/
    css/
      styles.css
    js/
      app.js
  README.md
  LICENSE
  .gitignore
```

## Local Run

1. Open `index.html` in a browser.
2. For best DX, run with a local static server (for example Live Server extension).

## Deployment

You can deploy this project as a static site:

1. Push repository to GitHub.
2. Import repository into Vercel or Netlify.
3. Set publish directory to repository root.
4. Confirm `index.html` is used as the entry point.
5. Add your live URL to the **Live Demo** section above.

## Portfolio Checklist

- Add screenshots to `assets/screenshots/`:
  - `cover.png` (main preview)
  - `desktop.png`
  - `mobile.png`
- Update this README with screenshot section
- Add the live demo link
- Keep one short section with known limitations and future improvements

## QA Checklist Before Final Publish

- Add task, edit task, mark done, delete task
- Filter and sort interactions
- Search behavior and empty states
- Deadline validation (including past-date restriction)
- Page refresh persistence (`localStorage`)
- Mobile layout checks
- 404 page check (`/404.html`)

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
