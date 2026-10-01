document.addEventListener('DOMContentLoaded', () => {
    const editBtn = document.getElementById('editProfileBtn');

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            // توجيه المستخدم إلى صفحة التعديل التي أرسلتها
            window.location.href = 'editprofile.html';
        });
    }
});