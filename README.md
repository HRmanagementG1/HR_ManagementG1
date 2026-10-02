# HR_ManagementG1
Hr management system for Orange code academy  

Open `index.html` through a web server such as VS Code Live Server. It opens the
home page with Employee login, HR login, and a My workspace link for a signed-in
user. Each login page links back home and to the other role's login.

Demo accounts:

- HR: `lina@workforce.example` / `Lina@123`
- Employee: `omar@workforce.example` / `Omar@123`

The employee login opens My Profile: a brief account summary and a working
password-change form. Information shows the employee's full record and salary.
The shared navigation connects tasks, leave, policies, meetings, and feedback.

The HR dashboard provides quick access to the people directory, onboarding,
tasks, submission review, leave, meetings, policies, and feedback. All Employees
shows real directory counts and full records, including salary. New employee
records include a temporary password, department, job title, salary, hire date,
phone, office, employment type, and manager.

HR assigns each task to an employee and can make it visible or HR only. Hidden
tasks are excluded from the employee board and direct task URLs. Employees can
move tasks into progress and submit a work reference, files, or both. Files are
limited to 20 MB each; HR can download them during review. HR then approves the
submission or requests a revision. Feedback and earlier attachments remain
available when the employee resubmits.

The browser stores the employee directory in `site_users`, the login session in
`site_session`, and task records in `site_tasks`. These pages share those records;
reloading or switching accounts does not reset them. Existing employee records
from the old `employees` storage key are included in the directory. This is a
browser-only classroom project; data is local to each browser. File contents are
saved in IndexedDB (`workforce-files`), with attachment metadata on each task.
For this demo, switch roles in the same browser and on the same server origin.
There is no server account system or cross-device synchronization.

With Node.js, Playwright, and Microsoft Edge available, run the workflow check:

```sh
node tests/workflow.cjs
```

Set `PLAYWRIGHT_PATH` to the Playwright package location if it is not installed
in the project's Node.js module search path.

The browser check covers home/login navigation, employee creation and salary,
assignment and task visibility, file upload/download, review and revisions,
password changes, role routing, and responsive navigation. Optional screenshots
are written when `WORKFLOW_SCREENSHOT_DIR` names an output directory.

On `secondVersion`, the homepage uses the supplied Mostar photographic layers
and Ogg Medium font directly from their remote URLs. The 3,700-pixel scroll story
is implemented in `Deyaa/HomePage/cinema.js` and `cinema.css`; reduced motion skips
pointer parallax and smoothing. Services, about, values, feedback and the shared
footer remain below it. `Shared/brand.css` applies the matching workspace palette.
Run `node tests/cinema.cjs` with network access to check the scene assets and carousel.

The Powered By page uses the supplied `Deyaa/team.json`. Portrait files were not
provided, so cards show initials. Add each image at its recorded path and set
`portraitAvailable: true` on that member when portraits are available.
