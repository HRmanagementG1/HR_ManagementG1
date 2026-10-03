// Employee Profile Page Script
document.addEventListener("DOMContentLoaded", async () => {
  const W = window.workspace;
  await W.ready;

  // Only allow Employee role to access this page.
  if (!W.requireRole("Employee")) return;
  const user = W.users().find((person) => person.id === String(W.session().id));
  if (!user) return;
  document
    .querySelectorAll("[data-user]")
    .forEach(
      (el) => (el.textContent = user[el.dataset.user] || "Not provided"),
    );
    // Set the profile department and employee code, and display the user's avatar or initials.
  document.getElementById("profileDepartment").textContent =
    `${user.department || "Employee"} · ${user.employeeCode || `EMP-${String(user.id).padStart(3, "0")}`}`;
  // Set the profile position and email, and display the user's avatar or initials.
    const avatar = document.getElementById("profileAvatar");
  avatar.textContent = user.name
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("");
  if (user.image && /^(https?:|data:image\/)/.test(user.image)) {
    const img = document.createElement("img");
    img.src = user.image;
    img.alt = user.name;
    avatar.replaceChildren(img);
  }
  if (document.getElementById("copyrightYear"))
    document.getElementById("copyrightYear").textContent =
      new Date().getFullYear();
      // Set up the password change form and handle its submission with validation and feedback.
  document.querySelectorAll("[data-toggle]").forEach((button) =>
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.toggle);
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.textContent = show ? "Hide" : "Show";
      button.setAttribute("aria-pressed", String(show));
      button.setAttribute(
        "aria-label",
        `${show ? "Hide" : "Show"} ${input.id === "currentPassword" ? "current" : input.id === "newPassword" ? "new" : "confirmed"} password`,
      );
    }),
  );
  // Handle password strength indicator and form submission for changing the password.
  const next = document.getElementById("newPassword");
  next.addEventListener("input", () => {
    const score = [
      next.value.length >= 8,
      /[a-z]/i.test(next.value) && /\d/.test(next.value),
      next.value.length >= 12,
      /[^a-z\d]/i.test(next.value),
    ].filter(Boolean).length;
    document.getElementById("strengthBar").style.width = `${score * 25}%`;
    document.getElementById("strengthLabel").textContent = next.value
      ? ["Too short", "Weak", "Good", "Strong", "Strong"][score]
      : "";
  });
  // Handle password change form submission with validation and feedback.
  document
    .getElementById("passwordForm")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      const users = W.users(),
        account = users.find((person) => person.id === user.id);
      const message = document.getElementById("passwordMessage");
      const show = (text, success = false) => {
        message.textContent = text;
        message.hidden = false;
        message.className = success ? "success" : "";
      };
      if (
        !account ||
        account.password !== document.getElementById("currentPassword").value
      )
        return show("The current password is incorrect.");
      if (
        next.value.length < 8 ||
        !/[a-z]/i.test(next.value) ||
        !/\d/.test(next.value)
      )
        return show(
          "Use at least 8 characters, including letters and numbers.",
        );
      if (next.value !== document.getElementById("confirmPassword").value)
        return show("The new passwords do not match.");
      if (next.value === account.password)
        return show("Choose a password different from your current password.");
      account.password = next.value;
      account.passwordUpdatedAt = new Date().toISOString();
      // Save the updated users list to browser storage and reset the form.
      W.save("site_users", users);
      event.target.reset();
      next.dispatchEvent(new Event("input"));
      show("Your password has been updated.", true);
    });
});
