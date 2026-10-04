# HR_ManagementG1
Hr management system for Orange code academy

Live Version: [Link](https://hrmanagementg1.github.io/HR_ManagementG1/)
<br>
Figma: [figma](https://www.figma.com/design/ipzudJJIUl49BYgllS42RA/NorthBank?node-id=105-2&p=f&t=wKjbqjEpY3N1pswR-0)
<br>
Trello: [trello](https://trello.com/b/uZRbCGCE/hr-mangement)

Open `index.html` through a web server such as VS Code Live Server. It opens the
home page with one Login button and a My workspace link for a signed-in user.
The login form has Employee login and HR login buttons above Welcome back;
switching roles keeps the same page open.

Demo accounts:

- HR: `lina@workforce.example` / `Lina@123`
- Employee: `omar@workforce.example` / `Omar@123`

The employee login opens My Profile: a brief account summary and a working
phone-number and password-change forms. Only those two fields can be edited by
employees. Information is read-only and shows the employee's full record and salary.
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

HR can block and unblock accounts without deleting employee records. Blocked
accounts cannot sign in, and the current HR account cannot block itself.
Employees have 15 calendar leave days per calendar year. Only approved requests
reduce the balance. Pending and rejected requests do not use days. Requests that
cross New Year count each day in its own year. HR cannot approve a request that
would exceed either year's allowance.
HR must enter a rejection reason, which appears in the employee's leave history.
The leave page displays the current year, maximum, approved days used, and remaining balance.
HR leave records load independently of attachment storage. Blocking and rejecting
requests use in-page confirmation dialogs.
HR can edit a task through the same form used to create it; edits preserve its
submission, attachments, status, and review feedback.

The updated page code uses the class topics: HTML required/minlength/maxlength
validation; DOM className and event listeners; template strings for display;
JSON for saved data; map/filter/reduce for directories, tasks, and leave totals;
and async/await with try/catch for loading and saving. Shared/workspace.js holds
the common data functions so login and other pages do not repeat that logic.
Run the focused behavior checks with: node tests/employee-controls.cjs
Run PDF generation checks for every policy with: node tests/policy-pdf.cjs
