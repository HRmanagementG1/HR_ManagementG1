document.addEventListener("DOMContentLoaded", async function () {
    const W = window.workspace;
    try { await W.ready; } catch (error) {
        document.getElementById("leave-table-body").innerHTML = '<tr><td colspan="7">Could not load employees. Please refresh.</td></tr>';
        return;
    }
    if (!W.requireRole("HR")) return;
    let employees = [];

    function getData(key) {
        return window.workspace.read(key);
    }

    function saveData(key, value) {
        window.workspace.save(key, value);
    }

    async function loadEmployees() {
        employees = W.users();
    }

    function getEmployee(id) {
        return employees.find(employee => String(employee.id) === String(id));
    }

    function getEmployeeName(id) {
        return getEmployee(id)?.name || 'Unknown Employee';
    }

    function getEmployeeRole(id) {
        const employee = getEmployee(id);
        return employee?.position || employee?.role || '';
    }

    function getEmployeeAvatar(id) {
        return getEmployee(id)?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(getEmployeeName(id))}&background=0F4C3A&color=fff&bold=true`;
    }

    const LEAVES_KEY = (typeof leavesKey !== "undefined") ? leavesKey : "site_leaves";
    const PER_PAGE = 5;

    let imagesDB = null;

    // Current UI state
    let currentFilter = "All";
    let currentSearch = "";
    let currentPage = 1;

    /* ---------------- IndexedDB ---------------- */
    function openImagesDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open("site_images", 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains("images")) {
                    db.createObjectStore("images", { keyPath: "id" });
                }
            };
            req.onsuccess = (e) => { imagesDB = e.target.result; resolve(imagesDB); };
            req.onerror = () => reject(req.error);
        });
    }

    function getImagesForLeave(leaveId) {
        return new Promise((resolve, reject) => {
            if (!imagesDB) return resolve([]);
            const tx = imagesDB.transaction("images", "readonly");
            const store = tx.objectStore("images");
            const req = store.getAll();
            req.onsuccess = () => {
                const all = req.result.filter(x => String(x.leaveId) === String(leaveId));
                resolve(all);
            };
            req.onerror = () => reject(req.error);
        });
    }


    /* ---------------- Date helpers ---------------- */
    function calculateDays(start, end) {
        const s = new Date(start);
        const e = new Date(end);
        return Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
    }

    function formatDateRange(start, end) {
        const s = new Date(start);
        const e = new Date(end);
        const sStr = s.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
        const eStr = e.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
        return `${sStr} - ${eStr}`;
    }

    /* ---------------- Stats ---------------- */
    function renderStats() {
        const leaves = window.workspace.leaves();
        const total    = leaves.length;
        const pending  = leaves.filter(l => l.status === "Pending").length;
        const approved = leaves.filter(l => l.status === "Approved").length;
        const declined = leaves.filter(l => l.status === "Declined").length;

        const el = (id) => document.getElementById(id);
        if (el("stat-total"))    el("stat-total").textContent    = total;
        if (el("stat-pending"))  el("stat-pending").textContent  = pending;
        if (el("stat-approved")) el("stat-approved").textContent = approved;
        if (el("stat-declined")) el("stat-declined").textContent = declined;

        const pendingPill = document.querySelector('.pill[data-filter="Pending"]');
        if (pendingPill) pendingPill.textContent = `Pending (${pending})`;
    }

    /* ---------------- Filtering ---------------- */
    function applyFilters() {
        let leaves = window.workspace.leaves();
        leaves = [...leaves].sort((a, b) => b.id - a.id);

        if (currentFilter === "Pending") {
            leaves = leaves.filter(l => l.status === "Pending");
        } else if (currentFilter !== "All") {
            leaves = leaves.filter(l => l.type === currentFilter);
        }

        const q = currentSearch.trim().toLowerCase();
        if (q) {
            leaves = leaves.filter(l =>
                getEmployeeName(l.owner).toLowerCase().includes(q) ||
                (l.reason || "").toLowerCase().includes(q)
            );
        }

        return leaves;
    }

    /* ---------------- Helpers for badges ---------------- */
    function getTypeClass(type) {
        return { Annual: "gray", Sick: "red", Personal: "gray", Unpaid: "dark" }[type] || "gray";
    }

    function getStatusClass(status) {
        if (status === "Approved") return "approved";
        if (status === "Pending")  return "pending";
        return "declined";
    }

    /* ---------------- Table render ---------------- */
    function renderTable() {
        const tbody = document.getElementById("leave-table-body");
        if (!tbody) return;

        const filtered = applyFilters();
        const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
        if (currentPage > totalPages) currentPage = totalPages;

        const startIdx = (currentPage - 1) * PER_PAGE;
        const pageItems = filtered.slice(startIdx, startIdx + PER_PAGE);

        if (pageItems.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="7">No leave requests found matching your filters.</td>
                </tr>`;
            renderPagination(0, 0, 0);
            return;
        }

        let html = "";
        pageItems.forEach(leave => {
            const name  = getEmployeeName(leave.owner);
            const role  = getEmployeeRole(leave.owner);
            const avatar= getEmployeeAvatar(leave.owner);
            const days  = calculateDays(leave.start, leave.end);
            const tCls  = getTypeClass(leave.type);
            const sCls  = getStatusClass(leave.status);

            const actionsHtml = leave.status === "Pending"
                ? `<button class="btn-approve" data-id="${leave.id}" title="Approve">
                        <i class="fa-solid fa-check"></i>
                   </button>
                   <button class="btn-decline" data-id="${leave.id}" title="Decline">
                        <i class="fa-solid fa-xmark"></i>
                   </button>`
                : `<span class="action-done">—</span>`;

            html += `
                <tr data-leave-id="${leave.id}">
                    <td data-label="Employee">
                        <div class="employee-cell">
                            <img alt="${name}" class="employee-avatar" src="${avatar}"/>
                            <div>
                                <div class="employee-name">${name}</div>
                                <div class="employee-role">${role}</div>
                            </div>
                        </div>
                    </td>
                    <td data-label="Leave Type">
                        <span class="type-badge ${tCls}">${leave.type} Leave</span>
                    </td>
                    <td data-label="Date Range">
                        <div class="date-range">${formatDateRange(leave.start, leave.end)}</div>
                    </td>
                    <td data-label="Duration">
                        <div class="duration">${days} calendar day${days === 1 ? "" : "s"}</div>
                    </td>
                    <td data-label="Reason">
                        <div class="reason" title="${(leave.reason || "").replace(/"/g, "&quot;")}">
                            ${window.workspace.escape(leave.reason || "")}
                            ${leave.rejectionReason ? `<p><strong>Rejected:</strong> ${window.workspace.escape(leave.rejectionReason)}</p>` : ""}
                        </div>
                    </td>
                    <td data-label="Status">
                        <span class="status-badge ${sCls}">
                            ${sCls === "pending" ? '<span class="dot"></span>' : ""}
                            ${leave.status}
                        </span>
                    </td>
                    <td data-label="Actions">
                        <div class="action-buttons">${actionsHtml}</div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
        renderPagination(startIdx + 1, Math.min(startIdx + PER_PAGE, filtered.length), filtered.length);
        attachImages();
    }

    /* ---------------- Pagination render ---------------- */
    function renderPagination(from, to, total) {
        const info = document.querySelector(".pagination-info");
        if (info) {
            info.innerHTML = `Showing <span>${total === 0 ? 0 : from}-${to}</span> of <span>${total}</span> requests`;
        }

        const controls = document.querySelector(".pagination-controls");
        if (!controls) return;

        const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
        const pages = [];

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else if (currentPage <= 3) {
            pages.push(1, 2, 3, 4, "...", totalPages);
        } else if (currentPage >= totalPages - 2) {
            pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
        }

        let html = `<button class="page-btn" data-page="prev" ${currentPage === 1 ? "disabled" : ""}>Previous</button>`;

        pages.forEach(p => {
            if (p === "...") {
                html += `<span class="page-dots">...</span>`;
            } else {
                html += `<button class="page-number ${p === currentPage ? "active" : ""}" data-page="${p}">${p}</button>`;
            }
        });

        html += `<button class="page-btn" data-page="next" ${currentPage === totalPages ? "disabled" : ""}>Next</button>`;

        controls.innerHTML = html;
    }

    /* ---------------- Attach stored images ---------------- */
    async function attachImages() {
        const rows = document.querySelectorAll("#leave-table-body tr[data-leave-id]");
        for (const row of rows) {
            const id = row.dataset.leaveId;
            try {
                const imgs = await getImagesForLeave(id);
                if (imgs.length === 0) continue;

                const reasonTd = row.querySelector('td[data-label="Reason"]');
                if (!reasonTd || reasonTd.querySelector(".leave-images")) continue;

                const box = document.createElement("div");
                box.className = "leave-images";

                imgs.forEach(img => {
                    const url = URL.createObjectURL(img.blob);
                    const el = document.createElement("img");
                    el.src = url;
                    el.className = "leave-thumb";
                    el.alt = img.name;
                    el.title = img.name;
                    el.addEventListener("click", () => window.open(url, "_blank"));
                    box.appendChild(el);
                });

                reasonTd.appendChild(box);
            } catch (err) {
                console.log(err);
            }
        }
    }

    /* ---------------- Filters & events ---------------- */
    function setupFilters() {
        const pills = document.querySelectorAll("#hr-filters .pill");
        pills.forEach(pill => {
            pill.addEventListener("click", function () {
                pills.forEach(p => p.classList.remove("active"));
                this.classList.add("active");
                currentFilter = this.dataset.filter || "All";
                currentPage = 1;
                renderTable();
            });
        });

        const searchInput = document.getElementById("hr-search");
        if (searchInput) {
            let timer = null;
            searchInput.addEventListener("input", function () {
                clearTimeout(timer);
                const v = this.value;
                timer = setTimeout(() => {
                    currentSearch = v;
                    currentPage = 1;
                    renderTable();
                }, 180);
            });
        }

        const controls = document.querySelector(".pagination-controls");
        if (controls) {
            controls.addEventListener("click", function (e) {
                const btn = e.target.closest("button[data-page]");
                if (!btn || btn.disabled) return;

                const total = applyFilters().length;
                const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
                const page = btn.dataset.page;

                if (page === "prev" && currentPage > 1) currentPage--;
                else if (page === "next" && currentPage < totalPages) currentPage++;
                else if (!isNaN(Number(page))) currentPage = Number(page);
                else return;

                renderTable();
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        }

        const refreshBtn = document.getElementById("hr-refresh");
        if (refreshBtn) {
            refreshBtn.addEventListener("click", () => {
                renderStats();
                renderTable();
            });
        }

        const exportBtn = document.getElementById("hr-export");
        if (exportBtn) {
            exportBtn.addEventListener("click", exportCSV);
        }
    }

    /* ---------------- Export CSV ---------------- */
    function exportCSV() {
        const leaves = applyFilters();
        let csv = "Employee,Type,Start Date,End Date,Duration,Reason,Status\n";
        leaves.forEach(l => {
            const days = calculateDays(l.start, l.end);
            const reason = (l.reason || "").replace(/"/g, '""');
            csv += `"${getEmployeeName(l.owner)}","${l.type}","${l.start}","${l.end}","${days}","${reason}","${l.status}"\n`;
        });

        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `leave-requests-${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /* ---------------- Approve / Decline ---------------- */
    const rejectionDialog = document.getElementById("rejectionDialog");
    const rejectionForm = document.getElementById("rejectionForm");
    let rejectingId = null;

    function saveDecision(id, status, reason) {
        if (!W.requireRole("HR")) return false;
        const leaves = W.leaves();
        const leave = leaves.find(item => String(item.id) === String(id));
        if (!leave || leave.status !== "Pending") return false;
        if (status === "Approved") {
            const allowanceError = W.leaveAllowanceError(leave.owner, leave.start, leave.end);
            if (allowanceError) {
                document.getElementById("leaveActionError").textContent = allowanceError;
                return false;
            }
        }
        leave.status = status;
        if (status === "Declined") leave.rejectionReason = reason;
        try {
            saveData(LEAVES_KEY, leaves);
            renderStats();
            renderTable();
            return true;
        } catch (error) {
            document.getElementById("leaveActionError").textContent = "Could not save this decision. Please try again.";
            return false;
        }
    }

    function setupActions() {
        document.getElementById("leave-table-body").addEventListener("click", function(event) {
            const approve = event.target.closest(".btn-approve");
            const decline = event.target.closest(".btn-decline");
            if (!approve && !decline) return;
            const id = (approve || decline).dataset.id;
            const leave = W.leaves().find(item => String(item.id) === String(id));
            if (!leave || leave.status !== "Pending") return;
            document.getElementById("leaveActionError").textContent = "";
            if (approve) { saveDecision(id, "Approved"); return; }
            rejectingId = id;
            rejectionForm.reset();
            document.getElementById("rejectionEmployee").textContent = "Request from " + getEmployeeName(leave.owner);
            document.getElementById("rejectionError").textContent = "";
            rejectionDialog.showModal();
            document.getElementById("rejectionReason").focus();
        });
        document.getElementById("cancelRejection").addEventListener("click", () => rejectionDialog.close());
        rejectionForm.addEventListener("submit", function(event) {
            event.preventDefault();
            const reason = document.getElementById("rejectionReason").value.trim();
            if (!this.reportValidity()) return;
            if (!reason) {
                document.getElementById("rejectionError").textContent = "Enter a rejection reason.";
                return;
            }
            if (saveDecision(rejectingId, "Declined", reason)) rejectionDialog.close();
            else document.getElementById("rejectionError").textContent = "Could not reject this request. Refresh and try again.";
        });
    }

    /* ---------------- Init ---------------- */
    async function init() {
        await loadEmployees();
        renderStats();
        renderTable();
        setupFilters();
        setupActions();
        try { await openImagesDB(); renderTable(); } catch (error) { console.warn("Leave attachments unavailable.", error); }
        window.addEventListener("storage", event => {
            if (event.key === LEAVES_KEY) { renderStats(); renderTable(); }
        });
    }

    await init();
});
