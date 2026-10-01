// add-employee.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addEmployeeForm');
    const alertMessage = document.getElementById('alertMessage');

    form.addEventListener('submit', function(e) {
        e.preventDefault(); // منع الصفحة من عمل Refresh عند الإرسال

        // 1. جلب القيم التي أدخلها موظف الـ HR
        const name = document.getElementById('empName').value;
        const email = document.getElementById('empEmail').value;
        const department = document.getElementById('empDepartment').value;
        const position = document.getElementById('empPosition').value;

        // 2. إنشاء كائن (Object) يمثل الموظف الجديد
        const newEmployee = {
            id: Date.now(), // إعطاء ID فريد للموظف بناءً على الوقت
            name: name,
            email: email,
            department: department,
            position: position,
            joinDate: new Date().toLocaleDateString('en-GB') // تاريخ اليوم
        };

        // 3. جلب بيانات الموظفين القديمة من Local Storage (أو إنشاء مصفوفة فارغة إذا لم تكن موجودة)
        let employees = JSON.parse(localStorage.getItem('employees')) || [];

        // 4. إضافة الموظف الجديد للمصفوفة
        employees.push(newEmployee);

        // 5. إعادة حفظ المصفوفة المحدثة في الـ Local Storage
        localStorage.setItem('employees', JSON.stringify(employees));

        // 6. عرض رسالة نجاح للمستخدم
        showAlert('تم إضافة الموظف بنجاح!', 'success');

        // 7. تفريغ الحقول لتكون جاهزة لإضافة موظف آخر
        form.reset();
    });

    // دالة مساعدة لعرض التنبيهات (Alerts)
    function showAlert(message, type) {
        alertMessage.textContent = message;
        alertMessage.className = `alert alert-${type} mt-3 text-center`;
        alertMessage.classList.remove('d-none'); // إظهار الرسالة

        // إخفاء الرسالة تلقائياً بعد 3 ثواني
        setTimeout(() => {
            alertMessage.classList.add('d-none');
        }, 3000);
    }
});