# TaskFlow – To-Do List Management System

A modern, responsive to-do dashboard built with plain HTML, CSS and JavaScript. No backend, no build step, no frameworks. Tasks are saved in the browser's LocalStorage, so they are still there after a refresh.

## Features

- **Dashboard:** welcome message, current date, and cards for Total, Completed, Pending and Overdue tasks, plus a completion progress bar.
- **Add / edit tasks:** title, description, priority (High, Medium, Low), category (Personal, Work, Study, Other) and due date.
- **Delete with confirmation:** a dialog asks before anything is removed.
- **Complete / undo:** click the circle to toggle; finished tasks are struck through and greyed out.
- **Filters:** All, Today, Upcoming, Pending, Completed, Overdue (also available from the sidebar).
- **Search and sort:** search by title; sort by due date, priority or recently added.
- **Categories view:** see task counts per category and filter by one.
- **Extras:** success notifications, friendly empty states, dark/light mode, "Clear completed", and "Delete all" in Settings.
- **Validation:** empty or too-short titles and missing due dates are blocked with inline messages.
- **Responsive:** sidebar becomes a slide-in menu on tablets and phones.

## Technologies

- HTML5 (semantic markup, `<dialog>` for modals)
- CSS3 (custom properties, Grid, Flexbox, media queries)
- JavaScript (ES6+, event delegation, LocalStorage)
- Font Awesome icons and the Manrope font (loaded from a CDN)

## Project structure

```
todo-management-system/
├── index.html   # page structure
├── style.css    # styling, themes, responsive layout
├── script.js    # state, storage, filters, rendering, events
└── README.md
```

## How to run

1. Download or clone the `todo-management-system` folder.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari).

That's it. An internet connection is only needed for the icons and font; without it the app still works, with fallback fonts and no icons.

## Notes

- On the first visit, a few sample tasks are added so you can explore. Use **Settings → Delete all** to remove them.
- To reset everything manually, clear the site's LocalStorage in your browser's developer tools.
