let editBtn = document.getElementById('edit-profile-btn');
let viewMode = document.getElementById('view-mode');
let editMode = document.getElementById('edit-mode');

// التبديل بين وضع العرض ووضع التعديل
editBtn.addEventListener('click', () => {
  let isEditing = viewMode.hidden;
  
  viewMode.hidden = !isEditing;
  editMode.hidden = isEditing;
  
  editBtn.textContent = isEditing ? 'Edit profile' : 'Back to profile';
});

// التعامل مع حفظ النموذج
editMode.addEventListener('submit', (e) => {
  e.preventDefault();
  
  // هنا يتم حفظ البيانات عادةً، سنكتفي بعرض رسالة وتحديث الواجهة للنسخة التجريبية
  alert('Profile updated successfully!');
  
  viewMode.hidden = false;
  editMode.hidden = true;
  editBtn.textContent = 'Edit profile';
});