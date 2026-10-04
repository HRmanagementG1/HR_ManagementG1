const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req,res) => {
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file = path.resolve(root,'.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file,(error,data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', {'.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'}[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const context = await browser.newContext();
    await context.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = []; page.on('pageerror',error => errors.push(error.message));
    page.on('response',response => { if (response.url().startsWith(origin) && response.status() >= 400 && !response.url().endsWith('/favicon.ico')) errors.push(`HTTP ${response.status()}: ${response.url()}`); });
    const open = route => page.goto(origin + route);
    const login = async (role,email,password) => {
      await open(role === 'HR' ? '/Ahmad/loginHr/LoginHr.html' : '/Ahmad/LoginEmp/LoginEmp.html');
      await page.locator(role === 'HR' ? '#workEmail' : '#username').fill(email);
      await page.locator('#password').fill(password);
      await page.locator('button[type=submit]').click();
      await page.waitForURL(role === 'HR' ? '**/TaskHr/dashboard.html' : '**/employee-profile/employee-profile.html');
      if (role !== 'HR') { await page.locator('[data-employee-page=tasks]').click(); await page.waitForURL('**/TaskEmp/my-tasks.html'); }
    };
    await open('/index.html');
    await page.waitForURL('**/HomePage/HomePage.html');
    await page.locator('.nav-actions').getByText('Login',{exact:true}).click();
    await page.locator('[data-login-role=HR]').click();
    assert.equal(new URL(page.url()).pathname,'/Ahmad/login.html');
    await page.waitForURL('**/Ahmad/login.html');
    await login('HR','lina@workforce.example','Lina@123');
    await open('/Ala%60a/task/allemployeehr/allemployeehr.html');
    await page.waitForFunction(() => document.querySelectorAll('#employeeTableBody tr').length === 6);
    await page.getByText('Add New Employee',{exact:false}).click();
    await page.locator('#empName').fill('Cycle Employee');
    await page.locator('#empEmail').fill('cycle@workforce.example');
    await page.locator('#empDepartment').selectOption('IT');
    await page.locator('#empPosition').fill('Developer');
    await page.locator('#empPhone').fill('+962 7 9000 0012');
    await page.locator('#empLocation').fill('Amman, Jordan');
    await page.locator('#empSalary').fill('62000');
    await page.locator('#empHireDate').fill('2026-10-01');
    await page.locator('#empManager').selectOption('1');
    await page.locator('#empBio').fill('A new member of the product team.');
    await page.locator('#empPassword').fill('Cycle@123');
    await page.locator('button[type=submit]').click();
    await page.waitForFunction(() => document.querySelector('#alertMessage').textContent.includes('Employee added'));
    await page.getByText('Back to Employees List').click();
    await page.waitForFunction(() => document.querySelector('#employeeTableBody').textContent.includes('Cycle Employee'));
    await page.locator('#employeeTableBody tr').filter({hasText:'Cycle Employee'}).getByText('More Details').click();
    assert.equal(await page.locator('#modalSalary').textContent(),'$62,000.00');
    await page.locator('#fullEmployeeRecord').click();
    await page.waitForFunction(() => document.querySelector('[data-user=name]')?.textContent === 'Cycle Employee');
    assert.equal(await page.locator('#annualSalary').textContent(),'$62,000.00 USD');
    assert.equal(await page.locator('[data-info=manager]').textContent(),'Lina Haddad');
    await open('/Lujain/TaskHr/add-task.html');
    await page.locator('#employeeSelect option').filter({hasText:'Cycle Employee'}).waitFor({state:'attached'});
    await page.locator('#employeeSelect').selectOption({label:'Cycle Employee'});
    await page.locator('[name=title]').fill('Complete <cycle>');
    await page.locator('[name=description]').fill('Review the workflow');
    await page.locator('[name=dueDate]').fill('2026-10-15');
    await page.locator('button').filter({hasText:'Create task'}).click();
    await page.waitForURL('**/all-tasks.html');
    await page.getByText('Details',{exact:true}).click();
    const taskId = new URL(page.url()).searchParams.get('id');
    await page.getByText('Hide from employee',{exact:true}).click();
    await page.getByText('Show to employee',{exact:true}).waitFor();
    await login('Employee','cycle@workforce.example','Cycle@123');
    assert.equal(await page.locator('.task-card').count(),0);
    await open(`/Lujain/TaskEmp/task-details.html?id=${taskId}`);
    await page.waitForFunction(() => document.querySelector('#employeeTaskDetail').textContent === 'Task not found.');
    await login('HR','lina@workforce.example','Lina@123');
    await open(`/Lujain/TaskHr/task-details.html?id=${taskId}`);
    await page.getByText('Show to employee',{exact:true}).click();
    await page.getByText('Hide from employee',{exact:true}).waitFor();
    const submit = async work => {
      await open(`/Lujain/TaskEmp/submit-task.html?id=${taskId}`);
      await page.waitForFunction(() => !document.querySelector('#submitForm input').disabled && document.querySelector('#submitTaskTitle h4'));
      await page.locator('[name=submission]').fill('');
      await page.locator('#taskAttachments').setInputFiles({name:work,mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4 Workforce test submission')});
      await page.locator('[name=comment]').fill('Employee comment');
      await page.locator('button').filter({hasText:'Submit task'}).click();
      await page.waitForURL('**/submission-success.html?*');
    };
    await login('Employee','cycle@workforce.example','Cycle@123');
    await page.getByText('View task',{exact:true}).click();
    await page.getByText('Start task',{exact:true}).click();
    await page.waitForFunction(() => document.querySelector('#employeeTaskDetail').textContent.includes('In progress'));
    await submit('first-version.pdf');
    await login('HR','lina@workforce.example','Lina@123');
    await open(`/Lujain/TaskHr/review-feedback.html?id=${taskId}`);
    await page.waitForFunction(() => document.querySelector('#reviewTask').textContent.includes('first-version.pdf'));
    const downloadReady = page.waitForEvent('download');
    await page.locator('.attachment-list button').filter({hasText:'first-version.pdf'}).click();
    const download = await downloadReady;
    assert.equal(download.suggestedFilename(),'first-version.pdf');
    assert.equal(fs.readFileSync(await download.path(),'utf8'),'%PDF-1.4 Workforce test submission');
    await page.locator('[name=feedback]').fill('Please add the missing section.');
    await page.locator('#reviseBtn').click();
    await page.waitForURL('**/submission-review.html');
    await login('Employee','cycle@workforce.example','Cycle@123');
    await page.getByText('View task',{exact:true}).click();
    await page.waitForFunction(() => document.querySelector('#employeeTaskDetail').textContent.includes('Please add the missing section.'));
    assert((await page.locator('#employeeTaskDetail').textContent()).includes('Please add the missing section.'));
    await submit('final-version.pdf');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('site_tasks'))[0]);
    assert.equal(stored.feedback,'Please add the missing section.');
    assert.equal(stored.comment,'Employee comment');
    await login('HR','lina@workforce.example','Lina@123');
    await open(`/Lujain/TaskHr/review-feedback.html?id=${taskId}`);
    await page.waitForFunction(() => document.querySelector('#reviewTask').textContent.includes('final-version.pdf'));
    await page.locator('#approveBtn').click();
    await page.waitForURL('**/submission-review.html');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('site_tasks'))[0].status),'Approved');
    await login('Employee','omar@workforce.example','Omar@123');
    await open(`/Lujain/TaskEmp/task-details.html?id=${taskId}`);
    await page.waitForFunction(() => document.querySelector('#employeeTaskDetail').textContent === 'Task not found.');
    await open('/index.html');
    await page.waitForURL('**/HomePage/HomePage.html');
    await page.locator('#resumeWorkspace').click();
    await page.waitForURL('**/employee-profile/employee-profile.html');
    await page.locator('[data-employee-page=profile]').click();
    await page.waitForFunction(() => document.querySelector('[data-user=name]')?.textContent === 'Omar Khalil');
    await page.locator('#currentPassword').fill('incorrect');
    await page.locator('#newPassword').fill('UpdatedOmar123');
    await page.locator('#confirmPassword').fill('UpdatedOmar123');
    await page.locator('.update-password').click();
    assert.equal(await page.locator('#passwordMessage').textContent(),'The current password is incorrect.');
    await page.locator('#currentPassword').fill('Omar@123');
    await page.locator('#confirmPassword').fill('NotTheSame123');
    await page.locator('.update-password').click();
    assert.equal(await page.locator('#passwordMessage').textContent(),'The new passwords do not match.');
    await page.locator('#confirmPassword').fill('UpdatedOmar123');
    await page.locator('.update-password').click();
    assert.equal(await page.locator('#passwordMessage').textContent(),'Your password has been updated.');
    await page.reload();
    await login('Employee','omar@workforce.example','UpdatedOmar123');
    await page.locator('[data-employee-page=information]').click();
    await page.waitForFunction(() => document.querySelector('[data-info=email]')?.textContent === 'omar@workforce.example');
    assert.equal(await page.locator('#annualSalary').textContent(),'$5,000.00 USD');
    await page.locator('#toggleSalary').click();
    assert.equal(await page.locator('#annualSalary').textContent(),'••••••');
    await page.locator('#toggleSalary').click();
    assert.equal(await page.locator('#annualSalary').textContent(),'$5,000.00 USD');
    await page.locator('#credentialButton').click();
    assert((await page.locator('#credentialDetails').textContent()).includes('EMP-002'));
    await page.locator('#closeCredential').click();
    for (const link of ['leaves','policy','meetings','feedback','tasks','profile','information']) {
      await page.locator(`[data-employee-page=${link}]`).click();
      await page.locator(`[data-employee-page=${link}][aria-current=page]`).waitFor();
      assert(!page.url().includes('/LoginEmp/'),`${link} should keep the employee signed in`);
    }
    // An employee session on an older HR page must be asked to sign in as HR.
    await open('/Lujain/TaskHr/all-tasks.html');
    await page.waitForURL('**/loginHr/LoginHr.html');
    await login('HR','lina@workforce.example','Lina@123');
    await page.evaluate(() => {
      const users = JSON.parse(localStorage.getItem('site_users'));
      users.find(person => person.id === '1').role = ' hr ';
      localStorage.setItem('site_users',JSON.stringify(users));
      const session = JSON.parse(localStorage.getItem('site_session')); session.role = 'hr';
      localStorage.setItem('site_session',JSON.stringify(session));
    });
    for (const [link,url] of [['tasks','**/TaskHr/all-tasks.html'],['dashboard','**/TaskHr/dashboard.html'],['employees','**/allemployeehr/allemployeehr.html']]) {
      await open('/Ahmad/policyHr/policyHr.html');
      await page.locator(`[data-hr-nav=${link}]`).click();
      await page.waitForURL(url);
      await page.waitForFunction(() => window.workspace && localStorage.getItem('site_session') && JSON.parse(localStorage.getItem('site_session')).role === 'HR');
    }
    for (const link of ['leave','policies','meetings','feedback','dashboard']) {
      await page.locator(`[data-hr-nav=${link}]`).click();
      await page.locator(`[data-hr-nav=${link}][aria-current=page]`).waitFor();
      await page.locator('footer.footer').waitFor();
      assert.equal(await page.locator('footer.footer').count(),1);
      assert(!page.url().includes('/loginHr/'),`${link} should keep HR signed in`);
    }
    await page.setViewportSize({width:390,height:844});
    await login('HR','lina@workforce.example','Lina@123');
    await open('/Ala%60a/task/allemployeehr/allemployeehr.html');
    await page.locator('[data-hr-nav=tasks]').waitFor({state:'visible'});
    if (process.env.WORKFLOW_SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.WORKFLOW_SCREENSHOT_DIR,{recursive:true});
      await page.setViewportSize({width:1000,height:900});
      await login('Employee','omar@workforce.example','UpdatedOmar123');
      await page.evaluate(() => localStorage.setItem('site_tasks',JSON.stringify([
        {id:'visual1',employeeId:'2',createdBy:'1',title:'Prepare new starter welcome pack',description:'Gather the employee handbook and first-week checklist.',dueDate:'2026-10-04',priority:'High',status:'To do'},
        {id:'visual2',employeeId:'2',createdBy:'3',title:'Review onboarding checklist',description:'Confirm the last details before the team arrives.',dueDate:'2026-10-05',priority:'High',status:'To do'},
        {id:'visual3',employeeId:'2',createdBy:'2',title:'Update the employee directory',description:'Review team roles and contact information.',dueDate:'2026-10-06',priority:'Normal',status:'In progress'},
        {id:'visual4',employeeId:'2',createdBy:'3',title:'Review workplace guidelines',description:'Read the latest company policies.',dueDate:'2026-10-02',priority:'Normal',status:'Approved'}
      ])));
      await page.reload();
      await page.locator('[data-task-status=visual1]').waitFor();
      await page.screenshot({path:path.join(process.env.WORKFLOW_SCREENSHOT_DIR,'tasks.png'),fullPage:true});
      await page.locator('[data-task-status=visual1]').selectOption('In progress');
      await page.waitForFunction(() => document.querySelector('#progressCount')?.textContent === '2');
      await page.locator('[data-task-status=visual1]').selectOption('Done');
      await page.waitForURL('**/submit-task.html?id=visual1');
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('site_tasks')).find(t => t.id === 'visual1').status),'In progress');
      for (const name of ['profile','information']) {
        await page.locator(`[data-employee-page=${name}]`).click();
        await page.waitForFunction(() => document.querySelector('[data-user=name]')?.textContent === 'Omar Khalil');
        await page.screenshot({path:path.join(process.env.WORKFLOW_SCREENSHOT_DIR,`${name}.png`),fullPage:true});
        await page.setViewportSize({width:390,height:844});
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} must fit on mobile`);
        await page.setViewportSize({width:1000,height:900});
      }
      await login('HR','lina@workforce.example','Lina@123');
      await page.screenshot({path:path.join(process.env.WORKFLOW_SCREENSHOT_DIR,'hr-dashboard.png'),fullPage:true});
      await page.locator('[data-hr-nav=tasks]').click();
      await page.waitForFunction(() => document.querySelectorAll('#allTasksBody tr').length === 4);
      await page.screenshot({path:path.join(process.env.WORKFLOW_SCREENSHOT_DIR,'hr-tasks.png'),fullPage:true});
      await page.locator('#allTasksBody [data-visibility=visual2]').click();
      await page.locator('#visibilityFilter').selectOption('hidden');
      assert.equal(await page.locator('#allTasksBody tr').count(),1);
      await page.locator('#boardView').click();
      assert.equal(await page.locator('#taskBoard article').count(),1);
      await page.locator('#tableView').click();
      await page.locator('[data-hr-nav=employees]').click();
      await page.waitForFunction(() => document.querySelectorAll('#employeeTableBody tr').length === 7);
      await page.screenshot({path:path.join(process.env.WORKFLOW_SCREENSHOT_DIR,'hr-employees.png'),fullPage:true});
      await open('/index.html');
      await page.waitForURL('**/HomePage/HomePage.html');
      await page.screenshot({path:path.join(process.env.WORKFLOW_SCREENSHOT_DIR,'home.png')});
      await page.setViewportSize({width:390,height:844});
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),'Home must fit on mobile');
    }
    await page.setViewportSize({width:1200,height:900});
    await login('HR','lina@workforce.example','Lina@123');
    await page.locator('[data-hr-nav=meetings]').click();
    await page.waitForFunction(() => document.querySelector('#schedule-employee')?.options.length > 1);
    assert.equal(await page.locator('#schedule-employee option[value="lina@workforce.example"]').count(),0);
    assert.equal(await page.locator('#schedule-employee option[value="cycle@workforce.example"]').count(),1);
    await page.locator('#open-schedule').click();
    assert(await page.locator('#schedule-employee').evaluate(el => el === document.activeElement));
    await page.locator('#schedule-employee').selectOption('omar@workforce.example');
    await page.locator('#schedule-topic').fill('Design review');
    await page.locator('#schedule-date').fill('2026-10-15');
    await page.locator('#schedule-time').fill('10:30');
    await page.locator('#meeting-link').fill('https://meet.jit.si/workforce-design-review');
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#create-meeting').click();
    const meeting = await page.evaluate(() => JSON.parse(localStorage.getItem('meetings')).at(-1));
    assert.equal(meeting.employeeEmail,'omar@workforce.example');
    assert.equal(meeting.hrRepresentative,'Lina Haddad');
    assert.equal(meeting.meetingLink,'https://meet.jit.si/workforce-design-review');
    // A manipulated selector must still reject the HR account.
    await page.evaluate(() => document.querySelector('#schedule-employee').add(new Option('Self','lina@workforce.example')));
    await page.locator('#schedule-employee').selectOption('lina@workforce.example');
    await page.locator('#schedule-topic').fill('Invalid self meeting');
    await page.locator('#schedule-date').fill('2026-10-15');
    await page.locator('#schedule-time').fill('11:00');
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#create-meeting').click();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('meetings')).at(-1).topic),'Design review');
    await page.locator('[data-hr-user-initials]').click();
    await page.waitForURL('**/TaskHr/dashboard.html');
    await page.evaluate(() => localStorage.setItem('feedback',JSON.stringify([{id:123,name:'Omar Khalil',topic:'Support',message:'Please review the updated workspace.',read:false}])));
    await page.locator('[data-hr-nav=feedback]').click();
    await page.locator('.feedback-message').waitFor();
    assert.equal(await page.getByText(/Reply via Email|Export Report|New Announcement/).count(),0);
    assert.equal(await page.locator('.feedback-pagination').count(),0);
    assert(await page.locator('.feedback-message').evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 15));
    await page.evaluate(() => window.siteFooterReady);
    if(process.env.WORKFLOW_SCREENSHOT_DIR) await page.screenshot({path:path.join(process.env.WORKFLOW_SCREENSHOT_DIR,'feedback-updated.png'),fullPage:true});
    await page.locator('.hr-brand').click();
    await page.waitForURL('**/HomePage/HomePage.html');
    assert.equal(await page.locator('.nav-actions a').count(),1);
    await page.locator('.home-logout').waitFor();
    await page.evaluate(() => window.siteFooterReady);
    assert.equal(await page.locator('footer [data-footer-service]').count(),6);
    await page.locator('#poweredBy').click();
    await page.waitForURL('**/PoweredBy.html');
    await login('Employee','omar@workforce.example','UpdatedOmar123');
    assert.equal(await page.locator('[data-employee-name]').textContent(),'Omar Khalil');
    for(const link of ['profile','information','leaves','policy','meetings','feedback','tasks']) {
      await page.locator(`[data-employee-page=${link}]`).click();
      await page.locator('footer.footer').waitFor();
      await page.evaluate(() => window.siteFooterReady);
      assert.equal(await page.locator('footer.footer').count(),1);
      assert((await page.locator('.employee-brand img').getAttribute('src')).endsWith('/Images/wanderly-logo.png'));
      await page.setViewportSize({width:390,height:844});
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),`${link} with shared footer must fit mobile`);
      await page.setViewportSize({width:1200,height:900});
    }
    await page.locator('.employee-brand').click();
    await page.waitForURL('**/HomePage/HomePage.html');
    assert.equal(await page.locator('.nav-actions a').count(),1);
    await page.locator('.home-logout').click();
    await page.locator('.nav-actions').getByText('Login',{exact:true}).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('site_session')),null);
    assert.deepEqual(errors,[]);
    console.log('PASS: employee/HR cycles, tasks and uploads, password and salary, meeting scheduling and self-exclusion, feedback controls, shared logos/footers, signed-in home navigation, logout and mobile layouts.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
