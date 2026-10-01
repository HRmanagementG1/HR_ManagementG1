document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggleSalary');
    const annualSalary = document.getElementById('annualSalary');
    const monthlySalary = document.getElementById('monthlySalary');
    
    // الأرقام الأصلية
    const originalAnnual = "$85,000 USD";
    const originalMonthly = "$7,083.33 / mo";
    
    // النص المخفي
    const hiddenText = "*******";
    
    let isHidden = false;

    if(toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isHidden = !isHidden;
            
            if(isHidden) {
                // إخفاء الرواتب وتغيير الأيقونة لعين مغلقة
                annualSalary.textContent = hiddenText;
                monthlySalary.textContent = hiddenText;
                toggleBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
            } else {
                // إظهار الرواتب وتغيير الأيقونة لعين مفتوحة
                annualSalary.textContent = originalAnnual;
                monthlySalary.textContent = originalMonthly;
                toggleBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
            }
        });
    }
});