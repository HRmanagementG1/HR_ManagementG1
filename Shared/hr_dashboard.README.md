# Shared HR sidebar and search bar

Share these files with your teammate:

| File | What to edit |
| --- | --- |
| `hr_dashboard.html` | Sidebar labels, links, and user-bar markup |
| `hr_dashboard.css` | Colors, spacing, and layout |
| `hr_dashboard.js` | Loading, logged-in user, and logout |
| `hr_dashboard.example.html` | Complete page to copy and adapt |

## Add it to your page

1. Keep the HTML, CSS, and JavaScript component files together in `Shared`.
2. Add these lines to your page's `<head>` (this example is for `Ahmad/policyHr`):

```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="../../Shared/hr_dashboard.css" />
<script defer src="../../Shared/hr_dashboard.js"></script>
<script defer src="your-page.js"></script>
```

3. Put your page content inside this layout:

```html
<div data-hr-dashboard-sidebar data-active-page="policies"></div>

<div class="hr-dashboard-content">
  <div data-hr-dashboard-topbar
       data-search-placeholder="Search policies, documents…"
       data-search-label="Search policies"></div>

  <main>
    <!-- Your own page content goes here. -->
  </main>
</div>
```

Available pages and their `data-active-page` values:

| Sidebar item | Value | Page |
| --- | --- | --- |
| Leave Requests | `leave` | `Wessam/hr_leave.html` |
| Policies | `policies` | `Ahmad/policyHr/policyHr.html` |
| Zoom Meetings | `meetings` | `Amani/meeting-HR/meeting-hr.html` |
| Feedback | `feedback` | `Amani/FeedbackHR/Feedbackhr.html` |

My Profile, All Employees, and Tasks still need their page paths before they can
be linked. Navigation opens the standalone HTML pages, so their own CSS and
JavaScript load along with the shared dashboard.

Change the search text for other pages. Use `../Shared/` for pages one folder below the project root, or
`Shared/` for a page in the root. Bootstrap CSS is not required for this component;
your own page may still need it.

## Use the search input

In `your-page.js`, wait for the component before attaching the search listener:

```js
async function setupSearch() {
  try {
    await window.hrDashboardReady;
    const search = document.getElementById('global-search');

    search.addEventListener('input', () => {
      const query = search.value.trim();
      // Filter your page using query.
    });
  } catch (error) {
    console.error('Could not set up search.', error);
  }
}

setupSearch();
```

The component supplies the input. Each page supplies its own filtering logic.

If a page already has a search input, add `data-search-target` to the header
placeholder to connect the shared search to it. For example, the leave page uses
`data-search-target="#hr-search"`. The two inputs stay in sync and the existing
page filter receives the input event.

## Where does the user come from?

The component reads the existing `site_session` value from browser local storage.
The session contains `name`, `role`, and optionally `position`:

```json
{ "name": "Lina Haddad", "role": "HR", "position": "People & Culture Lead" }
```

The login code saves this session. Without one, the header shows Guest. Logout
removes the session and opens the HR login page. This component displays the
session; it does not implement authentication.

## Preview and share

Open `Shared/hr_dashboard.example.html` through your project's web server (for
example, VS Code Live Server). Double-clicking the HTML file will not work because
the component loads its HTML with `fetch()`.

`hr_dashboard.zip` contains the three component files, this guide, and the example.
Your teammate can unzip it into the project's `Shared` folder and copy the example.
The example uses external fonts and icons, so those need internet access.

Navigation paths match this HR project. Update them in `hr_dashboard.html` and the
logout path in `hr_dashboard.js` when using the component in another project.
Navigation labels without pages are placeholders. The sidebar appears on desktop
screens (992px and wider), matching the policy page's original behavior.
