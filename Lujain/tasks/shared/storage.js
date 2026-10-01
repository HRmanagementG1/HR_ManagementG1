// واجهة موحدة للتعامل مع localStorage
window.Store = {
  get(key, fallback=[]) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  tasks() { return this.get("hrTasks", [
    {id:1,title:"Prepare new starter welcome pack",employeeId:103,priority:"High",status:"To do",dueDate:"2026-10-04",description:"Gather the employee handbook and first-week checklist.",submission:"",feedback:""},
    {id:2,title:"Update the employee directory",employeeId:101,priority:"Normal",status:"In progress",dueDate:"2026-10-06",description:"Review team roles and contact information.",submission:"",feedback:""},
    {id:3,title:"Review workplace guidelines",employeeId:102,priority:"Normal",status:"Done",dueDate:"2026-10-02",description:"Read the latest company policies.",submission:"",feedback:""}
  ]); },
  saveTasks(tasks) { this.set("hrTasks",tasks); },
  employee() { return this.get("currentEmployee", {id:101,name:"Omar Khalil"}); }
};
