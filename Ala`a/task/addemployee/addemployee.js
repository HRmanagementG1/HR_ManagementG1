document.addEventListener('DOMContentLoaded', async () => {
  const W = window.workspace;
  await W.ready;
  if (!W.requireRole('HR')) return;
  const form = document.getElementById('addEmployeeForm');
  const message = document.getElementById('alertMessage');
  const show = (text, type) => { message.textContent = text; message.className = `alert alert-${type}`; };
  W.users().forEach(person => { const option = document.createElement('option'); option.value = person.id; option.textContent = person.name; document.getElementById('empManager').append(option); });
  const today = new Date();
  document.getElementById('empHireDate').value = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const value = id => document.getElementById(id).value.trim();
    const name = value('empName'), email = value('empEmail').toLowerCase();
    if (!name) return show('Enter the employee name.', 'danger');
    if (W.users().some(person => person.email?.toLowerCase() === email)) return show('An employee with this email already exists.', 'danger');
    const employee = { id:crypto.randomUUID(), name, username:name, email,
      department:value('empDepartment'), position:value('empPosition'),
      role:value('empRole'), password:document.getElementById('empPassword').value,
      employeeCode:`EMP-${String(W.users().length+1).padStart(3,'0')}`,
      phone:value('empPhone'), salary:Number(value('empSalary')), hireDate:value('empHireDate'),
      employmentType:value('empEmploymentType'), managerId:value('empManager'), bio:value('empBio'),
      joinDate:new Date().toISOString(), location:value('empLocation') };
    W.save('site_users', [...W.users(), employee]);
    form.reset();
    show('Employee added. They can sign in with their email and temporary password and receive task assignments.', 'success');
  });
});
