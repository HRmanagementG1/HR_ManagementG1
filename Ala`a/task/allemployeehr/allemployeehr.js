(() => {

    // 1. الموظفون الافتراضيون
    const defaultEmployees = [
        { id: "100101", avatarImg: "", initials: "ER", name: "Elena Rostova", role: "Senior Frontend Lead", email: "elena.r@peoplepulse.io", department: "Product & Design", locationIcon: "fa-solid fa-building", locationText: "Amman HQ" },
        { id: "100102", avatarImg: "", initials: "MC", name: "Marcus Chen", role: "Product Designer", email: "marcus.c@peoplepulse.io", department: "Product & Design", locationIcon: "fa-solid fa-building", locationText: "Amman HQ" },
        { id: "100103", avatarImg: "", initials: "JD", name: "Julian Drake", role: "Staff Software Engineer", email: "julian.d@peoplepulse.io", department: "Engineering", locationIcon: "fa-solid fa-earth-americas", locationText: "Remote" },
        { id: "100104", avatarImg: "", initials: "SK", name: "Siddharth Kumar", role: "Growth Marketing Lead", email: "siddharth.k@peoplepulse.io", department: "Marketing", locationIcon: "fa-solid fa-earth-americas", locationText: "Remote" },
        { id: "100105", avatarImg: "", initials: "LH", name: "Lina Haddad", role: "People & Culture Lead", email: "lina.h@peoplepulse.io", department: "Human Resources", locationIcon: "fa-solid fa-building", locationText: "Amman HQ" },
        { id: "100106", avatarImg: "", initials: "NH", name: "Noor Hamdan", role: "QA Automation Engineer", email: "noor.h@peoplepulse.io", department: "Engineering", locationIcon: "fa-solid fa-location-dot", locationText: "Irbid Branch" },
        { id: "100107", avatarImg: "", initials: "KA", name: "Kareem Ali", role: "Content & Brand Strategist", email: "kareem.a@peoplepulse.io", department: "Marketing", locationIcon: "fa-solid fa-building", locationText: "Amman HQ" }
    ];

    // 2. جلب الموظفين الجدد
    let storedEmployees = JSON.parse(localStorage.getItem('employees')) || [];
    let newEmployeesMapped = storedEmployees.map(emp => {
        let initials = emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        return {
            id: emp.id.toString(),
            avatarImg: "", 
            initials: initials,
            name: emp.name,
            role: emp.position,
            email: emp.email,
            department: emp.department,
            locationIcon: "fa-solid fa-building",
            locationText: "Amman HQ"
        };
    });

    // دمج القائمتين لتكوين المصفوفة الشاملة
    let allEmployees = [...defaultEmployees, ...newEmployeesMapped];
    const tableBody = document.getElementById('employeeTableBody');

    // دالة إنشاء الصورة الرمزية (Avatar)
    function getAvatarHtml(emp) {
        if (emp.avatarImg) {
            return `<img src="${emp.avatarImg}" alt="${emp.name}" class="avatar">`;
        } else {
            return `<div class="avatar">${emp.initials}</div>`;
        }
    }

    // 3. دالة طباعة الجدول
    function renderTable(employeesArray) {
        tableBody.innerHTML = ''; // مسح الجدول القديم

        if (employeesArray.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:#64748b;">No employees found in this category.</td></tr>';
            return;
        }

        employeesArray.forEach((emp) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="emp-cell">
                        ${getAvatarHtml(emp)}
                        <div class="emp-info">
                            <span class="emp-name">${emp.name}</span>
                            <span class="emp-role-email">${emp.role} • ${emp.email}</span>
                        </div>
                    </div>
                </td>
                <td><span class="dept-badge">${emp.department}</span></td>
                <td>
                    <div class="location-cell"><i class="${emp.locationIcon}"></i> ${emp.locationText}</div>
                </td>
                <td>
                    <button class="btn-more" data-id="${emp.id}">More Details <i class="fa-solid fa-chevron-right" style="font-size:10px; margin-left:4px;"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    renderTable(allEmployees);

    // 4. --- تفعيل شريط البحث ---
    const searchInput = document.querySelector('.main-search input');
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase();
        const filteredEmployees = allEmployees.filter(emp => 
            emp.name.toLowerCase().includes(query) ||
            emp.role.toLowerCase().includes(query) ||
            emp.department.toLowerCase().includes(query) ||
            emp.email.toLowerCase().includes(query)
        );
        renderTable(filteredEmployees);
    });

    // 5. --- منطق تشغيل النافذة المنبثقة (Modal) ---
    const modal = document.getElementById('employeeModal');
    const closeBtn = document.getElementById('closeModalBtn');

    tableBody.addEventListener('click', function(e) {
        const btn = e.target.closest('.btn-more');
        if (!btn) return;

        const empId = btn.getAttribute('data-id');
        const emp = allEmployees.find(employee => employee.id === empId);

        if(emp) {
            document.getElementById('modalAvatar').textContent = emp.initials;
            document.getElementById('modalName').textContent = emp.name;
            document.getElementById('modalRole').textContent = emp.role;
            document.getElementById('modalDepartment').textContent = emp.department;
            document.getElementById('modalEmail').textContent = emp.email;
            document.getElementById('modalLocation').textContent = emp.locationText;
            document.getElementById('modalWorkId').textContent = emp.id.toString().slice(-6);
            document.getElementById('modalFullName').textContent = emp.name;
            modal.classList.add('active');
        }
    });

    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // ==========================================
    // 6. --- التحديث الجديد: الفلترة (التبويبات + زر الفلتر) ---
    // ==========================================

    const tabs = document.querySelectorAll('.tab');
    
    // أ- دالة لتحديث الأرقام داخل التبويبات بناءً على العدد الفعلي
    function updateTabCounts() {
        if(tabs.length >= 6) {
            tabs[0].textContent = `All Departments (${allEmployees.length})`;
            tabs[1].textContent = `Engineering (${allEmployees.filter(e => e.department === 'Engineering').length})`;
            tabs[2].textContent = `Product & Design (${allEmployees.filter(e => e.department === 'Product & Design').length})`;
            tabs[3].textContent = `Marketing (${allEmployees.filter(e => e.department === 'Marketing').length})`;
            tabs[4].textContent = `HR & Ops (${allEmployees.filter(e => e.department === 'Human Resources' || e.department === 'HR').length})`;
            tabs[5].textContent = `Sales (${allEmployees.filter(e => e.department === 'Sales').length})`;
        }
    }
    updateTabCounts(); // تحديث الأرقام فور تحميل الصفحة

    // ب- تفعيل الفلترة عند الضغط على التبويبات
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // تلوين التبويب النشط
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            const tabText = this.textContent.toLowerCase();
            let filtered = allEmployees;

            // تحديد القسم المطلوب
            if (!tabText.includes('all')) {
                if (tabText.includes('engineering')) filtered = allEmployees.filter(emp => emp.department === 'Engineering');
                else if (tabText.includes('product')) filtered = allEmployees.filter(emp => emp.department === 'Product & Design');
                else if (tabText.includes('marketing')) filtered = allEmployees.filter(emp => emp.department === 'Marketing');
                else if (tabText.includes('hr')) filtered = allEmployees.filter(emp => emp.department === 'Human Resources' || emp.department === 'HR');
                else if (tabText.includes('sales')) filtered = allEmployees.filter(emp => emp.department === 'Sales');
            }
            
            renderTable(filtered); // عرض النتيجة
        });
    });

    // ج- تفعيل زر الفلتر (Filters) لترتيب الموظفين أبجدياً (A-Z)
    const filterBtn = document.querySelector('.controls-row .btn-outline');
    let isAscending = false; 

    if(filterBtn) {
        filterBtn.addEventListener('click', () => {
            isAscending = !isAscending;
            
            // ترتيب البيانات
            allEmployees.sort((a, b) => {
                if (a.name.toLowerCase() < b.name.toLowerCase()) return isAscending ? -1 : 1;
                if (a.name.toLowerCase() > b.name.toLowerCase()) return isAscending ? 1 : -1;
                return 0;
            });

            // تغيير نص وأيقونة الزر
            filterBtn.innerHTML = isAscending ? 
                `<i class="fa-solid fa-arrow-down-a-z"></i> Sort A-Z` : 
                `<i class="fa-solid fa-arrow-up-z-a"></i> Sort Z-A`;

            // إعادة تشغيل التبويب النشط لتطبيق الترتيب على القسم المفتوح حالياً
            const activeTab = document.querySelector('.tab.active');
            if(activeTab) activeTab.click(); 
        });
    }

})()
