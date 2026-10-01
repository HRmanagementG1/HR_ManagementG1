document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profileForm');
    const alertBox = document.getElementById('alertMessage');

    // عناصر العرض في البطاقة اليسرى
    const displayAvatar = document.getElementById('displayAvatar');
    const displayName = document.getElementById('displayName');
    const displayRole = document.getElementById('displayRole');
    const displayEmail = document.getElementById('displayEmail');
    const displayPhone = document.getElementById('displayPhone');
    const displayLocation = document.getElementById('displayLocation');

    // عند إرسال النموذج (تحديث البيانات)
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault(); // منع تحديث الصفحة

        // 1. جلب القيم الجديدة من الحقول
        const newName = document.getElementById('inputName').value;
        const newEmail = document.getElementById('inputEmail').value;
        const newRole = document.getElementById('inputRole').value;
        const newPhone = document.getElementById('inputPhone').value;
        const newLocation = document.getElementById('inputLocation').value;

        // 2. استخراج أول حرفين للصورة الرمزية (Avatar)
        const initials = newName.split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

        // 3. تحديث البطاقة اليسرى بالبيانات الجديدة
        displayAvatar.textContent = initials;
        displayName.textContent = newName;
        displayRole.textContent = newRole;
        displayEmail.textContent = newEmail;
        displayPhone.textContent = newPhone;
        displayLocation.textContent = newLocation;

        // 4. عرض رسالة النجاح
        alertBox.textContent = 'Profile updated successfully!';
        alertBox.className = 'alert-box alert-success';
        alertBox.style.display = 'block';

        // إخفاء الرسالة بعد 3 ثوانٍ
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 3000);
    });
});