// وظائف صفحات HR: عرض المهام وإنشاؤها ومراجعتها
document.addEventListener("DOMContentLoaded",()=>{
 let tasks=Store.tasks(); const employees=window.demoEmployees;
 const $=id=>document.getElementById(id);
 const emp=id=>employees.find(e=>e.id==id)?.name||"Employee";
 const card=t=>`<article class="task-row"><span class="pill ${t.priority==="High"?"high":""}">${t.priority} priority</span><h5 class="mt-2">${t.title}</h5><p class="muted">${emp(t.employeeId)} · Due ${t.dueDate}</p><p>${t.status}</p><a class="btn-teal" href="task-details.html?id=${t.id}">View details</a></article>`;
 if($("totalTasks")){$("totalTasks").textContent=tasks.length;$("todoTasks").textContent=tasks.filter(t=>t.status==="To do").length;$("progressTasks").textContent=tasks.filter(t=>t.status==="In progress").length;$("pendingTasks").textContent=tasks.filter(t=>t.status==="Submitted").length;$("taskList").innerHTML=tasks.slice(0,4).map(card).join("")||"No tasks yet";}
 if($("employeeSelect"))$("employeeSelect").innerHTML=employees.map(e=>`<option value="${e.id}">${e.name}</option>`).join("");
 if($("taskForm"))$("taskForm").addEventListener("submit",e=>{e.preventDefault();let d=Object.fromEntries(new FormData(e.target));tasks.push({id:Date.now(),...d,employeeId:+d.employeeId,status:"To do",submission:"",feedback:""});Store.saveTasks(tasks);location.href="all-tasks.html";});
 const row=t=>`<tr><td>${t.title}</td><td>${emp(t.employeeId)}</td><td>${t.priority}</td><td>${t.status}</td><td>${t.dueDate}</td><td><a href="task-details.html?id=${t.id}">Details</a></td></tr>`;
 if($("allTasksBody")){const render=q=>$("allTasksBody").innerHTML=tasks.filter(t=>(t.title+" "+emp(t.employeeId)).toLowerCase().includes(q.toLowerCase())).map(row).join("");render("");$("searchTasks").addEventListener("input",e=>render(e.target.value));}
 let id=+(new URLSearchParams(location.search).get("id")||tasks[0]?.id);let task=tasks.find(t=>t.id===id);
 if($("taskDetail"))$("taskDetail").innerHTML=task?`<h3>${task.title}</h3><p>${task.description}</p><p>Employee: ${emp(task.employeeId)}</p><p>Priority: ${task.priority}</p><p>Status: ${task.status}</p><p>Due: ${task.dueDate}</p><p>Submission: ${task.submission||"Not submitted"}</p><a class="btn-teal" href="review-feedback.html?id=${task.id}">Review / feedback</a>`:"Task not found";
 if($("trackingList"))$("trackingList").innerHTML=employees.map(e=>{let own=tasks.filter(t=>t.employeeId===e.id),done=own.filter(t=>t.status==="Done"||t.status==="Approved").length,pct=own.length?Math.round(done/own.length*100):0;return `<article class="card"><h5>${e.name}</h5><p class="muted">${own.length} tasks</p><div class="progress"><div class="progress-bar" style="width:${pct}%;background:var(--teal)"></div></div><p class="mt-2">${pct}% completed</p></article>`}).join("");
 if($("submissionList"))$("submissionList").innerHTML=tasks.filter(t=>t.status==="Submitted"||t.status==="Revision Required").map(card).join("")||"<p>No submissions waiting.</p>";
 if($("reviewTask"))$("reviewTask").innerHTML=task?`<h4>${task.title}</h4><p>Employee: ${emp(task.employeeId)}</p><p>Submission: ${task.submission||"No link provided"}</p><p>Current feedback: ${task.feedback||"—"}</p>`:"Task not found";
 const review=(status)=>{if(!task)return;task.feedback=$("reviewForm").elements.feedback.value;task.status=status;Store.saveTasks(tasks);location.href="submission-review.html";};
 if($("approveBtn"))$("approveBtn").onclick=()=>review("Approved");
 if($("reviseBtn"))$("reviseBtn").onclick=()=>review("Revision Required");
});