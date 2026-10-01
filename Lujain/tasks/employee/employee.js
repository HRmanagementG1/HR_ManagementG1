// وظائف واجهات الموظف: المهام والتسليم وملاحظات HR
document.addEventListener("DOMContentLoaded",()=>{
 let tasks=Store.tasks(),employee=Store.employee(),id=+(new URLSearchParams(location.search).get("id")||tasks.find(t=>t.employeeId===employee.id)?.id),task=tasks.find(t=>t.id===id);
 const $=id=>document.getElementById(id);
 const card=t=>`<article class="task-card"><span class="pill ${t.priority==="High"?"high":""}">${t.priority} priority</span><h5 class="mt-2">${t.title}</h5><p class="muted">${t.dueDate}</p><p>${t.status}</p><a class="btn-teal" href="task-details.html?id=${t.id}">View task</a></article>`;
 let mine=tasks.filter(t=>t.employeeId===employee.id);
 if($("todoColumn")){$("todoColumn").innerHTML=mine.filter(t=>t.status==="To do").map(card).join("");$("progressColumn").innerHTML=mine.filter(t=>t.status==="In progress").map(card).join("");$("doneColumn").innerHTML=mine.filter(t=>["Submitted","Done","Approved"].includes(t.status)).map(card).join("");}
 if($("employeeTaskDetail"))$("employeeTaskDetail").innerHTML=task?`<h3>${task.title}</h3><p>${task.description}</p><p>Priority: ${task.priority}</p><p>Due date: ${task.dueDate}</p><p>Status: ${task.status}</p><a class="btn-teal" href="submit-task.html?id=${task.id}">Submit work</a>`:"Task not found";
 if($("submitTaskTitle"))$("submitTaskTitle").innerHTML=task?`<h4>${task.title}</h4><p>${task.description}</p>`:"Task not found";
 if($("submitForm"))$("submitForm").addEventListener("submit",e=>{e.preventDefault();if(!task)return;let d=Object.fromEntries(new FormData(e.target));task.submission=d.submission;task.feedback=d.comment;task.status="Submitted";Store.saveTasks(tasks);location.href=`submission-success.html?id=${task.id}`;});
 if($("revisionList"))$("revisionList").innerHTML=mine.filter(t=>t.status==="Revision Required").map(t=>`<article class="card"><h5>${t.title}</h5><p>${t.feedback||"Please update your work."}</p><a class="btn-teal" href="submit-task.html?id=${t.id}">Resubmit</a></article>`).join("")||"<p>No revisions requested.</p>";
});