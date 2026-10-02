(() => {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("site_session"));
  } catch {}
  const hr = String(user?.role).trim().toLowerCase() === "hr";
  const resume = document.getElementById("resumeWorkspace");
  if (user && resume) {
    document.querySelectorAll(".nav-actions a").forEach((link) => {
      if (link !== resume) link.remove();
    });
    const logout = document.createElement("button");
    logout.type = "button";
    logout.className = "home-logout";
    logout.textContent = "Log out";
    logout.addEventListener("click", () => {
      localStorage.removeItem("site_session");
      localStorage.removeItem("loggedInUser");
      location.reload();
    });
    resume.before(logout);
    resume.hidden = false;
    resume.href = hr
      ? "../../Lujain/TaskHr/dashboard.html"
      : "../../Ala%60a/task/employee-profile/employee-profile.html";
  }
  if (hr) {
    const routes = {
      "LeaveApplication.html": "../../Wessam/hr_leave.html",
      "Employees.html": "../../Ala%60a/task/allemployeehr/allemployeehr.html",
      "Policies.html": "../../Ahmad/policyHr/policyHr.html",
      "Tasks.html": "../../Lujain/TaskHr/all-tasks.html",
      "Feedback.html": "../../Amani/FeedbackHR/Feedbackhr.html",
      "ZoomMeeting.html": "../../Amani/meeting-HR/meeting-hr.html",
    };
    document
      .querySelectorAll("[data-home-service]")
      .forEach((card) => {
        card.dataset.serviceUrl = routes[card.dataset.homeService];
        card.href = card.dataset.serviceUrl;
      });
  }
})();
