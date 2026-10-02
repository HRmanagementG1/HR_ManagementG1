document.addEventListener("DOMContentLoaded", async () => {
  const W = window.workspace;
  await W.ready;
  if (!W.requireRole("Employee")) return;
  const $ = (id) => document.getElementById(id),
    esc = W.escape;
  const mine = W.tasks().filter(
    (t) =>
      String(t.employeeId) === String(W.session().id) &&
      t.visibleToEmployee !== false,
  );
  const task = mine.find(
    (t) => String(t.id) === new URLSearchParams(location.search).get("id"),
  );
  const editable =
    task && ["To do", "In progress", "Revision Required"].includes(task.status);
  const card = (t) => {
    const locked = ["Submitted", "Done", "Approved"].includes(t.status);
    const owner = W.users().find(
      (person) => String(person.id) === String(t.createdBy),
    );
    const options = locked
      ? [t.status]
      : [
          "To do",
          "In progress",
          ...(t.status === "Revision Required" ? ["Revision Required"] : []),
          "Done",
        ];
    return `<article class="task-card"><span class="pill ${t.priority === "High" ? "high" : ""}">${esc(t.priority)} priority</span><h5>${esc(t.title)}</h5><p class="task-description">${esc(t.description)}</p><div class="task-meta"><span>${esc(owner?.name || W.session().name)}</span><span>Due ${esc(t.dueDate)}</span></div>${t.feedback ? `<p class="task-feedback">${esc(t.feedback)}</p>` : ""}<div class="task-status-label"><label for="status-${esc(t.id)}">Status</label><a href="task-details.html?id=${encodeURIComponent(t.id)}">View task</a></div><select id="status-${esc(t.id)}" data-task-status="${esc(t.id)}" aria-label="Status for ${esc(t.title)}" ${locked ? "disabled" : ""}>${options.map((status) => `<option ${status === t.status ? "selected" : ""}>${esc(status)}</option>`).join("")}</select></article>`;
  };
  if ($("todoColumn")) {
    $("todoColumn").innerHTML =
      mine
        .filter((t) => ["To do", "Revision Required"].includes(t.status))
        .map(card)
        .join("") || "<p>No tasks to do.</p>";
    $("progressColumn").innerHTML =
      mine
        .filter((t) => t.status === "In progress")
        .map(card)
        .join("") || "<p>No tasks in progress.</p>";
    $("doneColumn").innerHTML =
      mine
        .filter((t) => ["Submitted", "Done", "Approved"].includes(t.status))
        .map(card)
        .join("") || "<p>No submissions yet.</p>";
    if ($("taskEmployeeName"))
      $("taskEmployeeName").textContent = W.session().name;
    ["todo", "progress", "done"].forEach((column) => {
      if ($(column + "Count"))
        $(column + "Count").textContent = $(column + "Column").querySelectorAll(
          ".task-card",
        ).length;
    });
    document.querySelectorAll("[data-task-status]").forEach((select) =>
      select.addEventListener("change", () => {
        const latest = W.tasks().find(
          (t) =>
            String(t.id) === select.dataset.taskStatus &&
            String(t.employeeId) === String(W.session().id),
        );
        if (
          !latest ||
          latest.visibleToEmployee === false ||
          ["Submitted", "Done", "Approved"].includes(latest.status)
        )
          return;
        if (select.value === "Done") {
          location.href = `submit-task.html?id=${encodeURIComponent(latest.id)}`;
          return;
        }
        if (!["To do", "In progress"].includes(select.value)) return;
        W.updateTask(latest.id, { status: select.value });
        location.reload();
      }),
    );
  }
  if ($("employeeTaskDetail")) {
    $("employeeTaskDetail").innerHTML = task
      ? `<h3>${esc(task.title)}</h3><p>${esc(task.description)}</p><p>Priority: ${esc(task.priority)}</p><p>Due: ${esc(task.dueDate)}</p><p>Status: ${esc(task.status)}</p><p>HR feedback: ${esc(task.feedback || "No feedback yet.")}</p>${task.status === "To do" ? '<button class="btn-teal" id="startTask">Start task</button> ' : ""}${editable ? `<a class="btn-teal" href="submit-task.html?id=${encodeURIComponent(task.id)}">Submit work</a>` : ""}`
      : "Task not found.";
    if ($("startTask"))
      $("startTask").onclick = () => {
        const latest = W.tasks().find((t) => t.id === task.id);
        if (latest?.visibleToEmployee !== false)
          W.updateTask(task.id, { status: "In progress" });
        location.reload();
      };
    if (task) {
      const files = document.createElement("div");
      files.className = "attachment-list";
      $("employeeTaskDetail").append(files);
      window.taskFiles.render(files, task.attachments);
    }
  }
  if ($("submitTaskTitle"))
    $("submitTaskTitle").innerHTML = editable
      ? `<h4>${esc(task.title)}</h4><p>${esc(task.description)}</p><p>HR feedback: ${esc(task.feedback || "No feedback yet.")}</p>`
      : "<p>This task is unavailable for submission.</p>";
  if ($("submitForm")) {
    if (!editable)
      $("submitForm")
        .querySelectorAll("input,textarea,button")
        .forEach((el) => (el.disabled = true));
    else {
      $("submitForm").elements.submission.value = task.submission || "";
      $("submitForm").elements.comment.value = task.comment || "";
    }
    if (task)
      window.taskFiles.render($("existingAttachments"), task.attachments);
    $("submitForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const latest = W.tasks().find((t) => String(t.id) === String(task?.id));
      if (
        !editable ||
        !latest ||
        latest.visibleToEmployee === false ||
        !["To do", "In progress", "Revision Required"].includes(latest.status)
      )
        return;
      const data = Object.fromEntries(new FormData(event.target));
      const selected = [...$("taskAttachments").files];
      const message = $("submissionMessage");
      message.hidden = true;
      if (
        !data.submission.trim() &&
        !selected.length &&
        !latest.attachments?.length
      ) {
        message.textContent =
          "Upload a file or enter a work link before submitting.";
        message.hidden = false;
        return;
      }
      const submit = event.target.querySelector("button[type=submit]");
      submit.disabled = true;
      try {
        const uploaded = selected.length
          ? await window.taskFiles.save(selected, task.id)
          : [];
        const current = W.tasks().find((t) => t.id === task.id);
        if (
          !current ||
          current.visibleToEmployee === false ||
          !["To do", "In progress", "Revision Required"].includes(
            current.status,
          )
        )
          throw new Error("This task is no longer available for submission.");
        W.updateTask(task.id, {
          submission: data.submission.trim(),
          attachments: [...(current.attachments || []), ...uploaded],
          comment: data.comment.trim(),
          status: "Submitted",
          submittedAt: new Date().toISOString(),
        });
        location.href = `submission-success.html?id=${encodeURIComponent(task.id)}`;
      } catch (error) {
        message.textContent = error.message;
        message.hidden = false;
        submit.disabled = false;
      }
    });
  }
  if ($("revisionList"))
    $("revisionList").innerHTML =
      mine
        .filter((t) => t.status === "Revision Required")
        .map(
          (t) =>
            `<article class="card"><h5>${esc(t.title)}</h5><p>${esc(t.feedback)}</p><a class="btn-teal" href="submit-task.html?id=${encodeURIComponent(t.id)}">Resubmit</a></article>`,
        )
        .join("") || "<p>No revisions requested.</p>";
});
