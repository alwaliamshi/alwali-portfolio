# Alwali Portfolio — Reference UI Build

This version implements the supplied `SAMPLE THEME 2.png` as the visual specification for the public portfolio and Admin dashboard. The UI is built as real React/CSS components; the reference image is not used as a page background.

## Default visual identity
- Dark glassmorphism layout
- Red/blue neon wave background on the public site
- Red/blue animated glossy underline under `ali Umara Am`
- Public navigation, hero, Featured Projects, Certificates empty state and footer follow the supplied reference composition
- Admin route uses the same sidebar, topbar, four statistics cards, Quick Actions, Recent Activity, Site Appearance and Upload a Document composition
- Optional custom wallpaper remains available; removing it restores the red/blue default theme

## Dynamic content
- Projects are managed through the Admin UI and stored in `server/data/projects.json`.
- Certificates/documents are managed through the Admin UI and stored in `server/data/documents.json`.
- Certificates use the automatically generated public-safe copy for visitors while the original is protected behind Admin authorization.
- Resume uses the latest uploaded resume automatically on the public Resume page.
- Toast notifications disappear automatically after a few seconds.

## Run locally

```powershell
npm install
npm run server
```

In a second terminal:

```powershell
npm run dev
```

Open the Vite URL shown in the terminal, then use `/admin` for the management area.

Create `server/.env` from `server/.env.example` and set a strong administrator password before real use.

## Notes
The development environment used to prepare this archive did not complete a full dependency installation within the available build window, so the final Vite build should be run on the target Windows machine after `npm install`. The Node server files were syntax-checked successfully.
