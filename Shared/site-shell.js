(() => {
  const root = new URL('../', document.currentScript.src);
  window.siteFooterReady = (async () => {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = new URL('Deyaa/Footer/Footer.css', root);
    document.head.append(css);
    const brand = document.createElement('link');
    brand.rel = 'stylesheet'; brand.href = new URL('Shared/brand.css', root);
    document.head.append(brand);
    const response = await fetch(new URL('Deyaa/Footer/Footer.html', root));
    if (!response.ok) throw new Error('Could not load footer');
    const template = document.createElement('template'); template.innerHTML = await response.text();
    const footer = template.content.querySelector('footer');
    footer.querySelectorAll('[href],[src]').forEach(el => {
      const attr = el.hasAttribute('href') ? 'href' : 'src';
      el.setAttribute(attr, new URL(el.getAttribute(attr), new URL('Deyaa/Footer/', root)));
    });
    let session = null; try { session = JSON.parse(localStorage.getItem('site_session')); } catch {}
    const hr = String(session?.role).trim().toLowerCase() === 'hr';
    const routes = hr
      ? ['Wessam/hr_leave.html','Ala%60a/task/allemployeehr/allemployeehr.html','Ahmad/policyHr/policyHr.html','Lujain/TaskHr/all-tasks.html','Amani/FeedbackHR/Feedbackhr.html','Amani/meeting-HR/meeting-hr.html']
      : ['Wessam/employee_leave.html','Ala%60a/task/information/information.html','Ahmad/policyEmp/policyEmp.html','Lujain/TaskEmp/my-tasks.html','Amani/employeeFeedback/FeedbackEmployee.html','Amani/employee-meeting/meeting-employee.html'];
    footer.querySelectorAll('[data-footer-service]').forEach((link,i) => link.href = new URL(session ? routes[i] : 'Ahmad/LoginEmp/LoginEmp.html', root));
    (document.querySelector('.hr-dashboard-content') || document.body).append(footer);
  })();
})();
