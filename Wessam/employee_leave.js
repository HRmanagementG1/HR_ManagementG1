document.addEventListener("DOMContentLoaded", async function () {
    await window.workspace.ready;
    if (!window.workspace.requireRole("Employee")) return;
    const { getData, saveData } = window.employeeWorkspace;
    const currentUser = window.employeeWorkspace.getCurrentUser();
    const LEAVES_KEY = (typeof leavesKey !== "undefined") ? leavesKey : "site_leaves";
    let currentFilter = "All";
    let imagesDB = null;

    /* ==================== IndexedDB ==================== */
    function openImagesDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open("site_images", 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains("images")) {
                    db.createObjectStore("images", { keyPath: "id" });
                }
            };
            req.onsuccess = (e) => { imagesDB = e.target.result; resolve(); };
            req.onerror = () => reject(req.error);
        });
    }

    function getImagesForLeave(leaveId) {
        return new Promise((resolve) => {
            if (!imagesDB) return resolve([]);
            const tx = imagesDB.transaction("images", "readonly");
            const store = tx.objectStore("images");
            const req = store.getAll();
            req.onsuccess = () => {
                resolve(req.result.filter(x => String(x.leaveId) === String(leaveId)));
            };
            req.onerror = () => resolve([]);
        });
    }

    /* ==================== Helpers ==================== */
    function calculateDays(start, end) {
        return Math.floor((new Date(end) - new Date(start)) / 86400000) + 1;
    }

    function getMyLeaves() {
        const all = window.workspace.leaves();
        if (!currentUser) return [];
        return all.filter(l => String(l.owner) === String(currentUser.id));
    }

    function getFilteredLeaves() {
        const mine = getMyLeaves();
        if (currentFilter === "All") return mine;
        return mine.filter(l => l.status === currentFilter);
    }

    /* ==================== Stats ==================== */
    function renderStats() {
        const mine = getMyLeaves();
        const pending  = mine.filter(l => l.status === "Pending").length;
        const approved = mine.filter(l => l.status === "Approved").length;
        const usage = window.workspace.leaveUsage(currentUser.id);
        const days = usage.remaining;
        document.getElementById("leave-year").textContent = usage.year;
        document.getElementById("leave-maximum").textContent = usage.maximum;
        document.getElementById("leave-used").textContent = usage.used;

        document.getElementById("stat-total").textContent    = mine.length;
        document.getElementById("stat-pending").textContent  = pending;
        document.getElementById("stat-approved").textContent = approved;
        document.getElementById("stat-days").textContent     = days;
    }

    /* ==================== List ==================== */
    async function renderList() {
        const list = document.getElementById("leave-list");
        const leaves = getFilteredLeaves().sort((a, b) => b.id - a.id);

        if (leaves.length === 0) {
            list.innerHTML = `
                <div class="empty">
                    <strong>No leave applications yet</strong>
                    Your submitted requests will appear here.
                </div>`;
            return;
        }

        let html = "";
        leaves.forEach(l => {
            const days = calculateDays(l.start, l.end);
            const statusCls = l.status === "Approved" ? "approved"
                            : l.status === "Declined" ? "declined" : "";

            html += `
                <article class="leave-record" data-leave-id="${l.id}">
                    <div class="spread">
                        <div>
                            <h3>${l.type} leave</h3>
                            <div class="leave-meta">${l.start} - ${l.end} · ${days} day(s)</div>
                        </div>
                        <span class="status ${statusCls}">${l.status}</span>
                    </div>
                    <p>${window.workspace.escape(l.reason || "")}</p>
                    ${l.rejectionReason ? `<p class="rejection-reason"><strong>HR rejection reason:</strong> ${window.workspace.escape(l.rejectionReason)}</p>` : ""}
                </article>
            `;
        });

        list.innerHTML = html;
        await attachImages();
    }

    async function attachImages() {
        const records = document.querySelectorAll(".leave-record[data-leave-id]");
        for (const rec of records) {
            const id = rec.dataset.leaveId;
            const imgs = await getImagesForLeave(id);
            if (imgs.length === 0) continue;

            const box = document.createElement("div");
            box.className = "leave-images";

            imgs.forEach(img => {
                const url = URL.createObjectURL(img.blob);
                const el = document.createElement("img");
                el.src = url;
                el.alt = img.name;
                el.title = img.name;
                el.addEventListener("click", () => window.open(url, "_blank"));
                box.appendChild(el);
            });

            rec.appendChild(box);
        }
    }

    /* ==================== Filters ==================== */
    function setupFilters() {
        const pills = document.querySelectorAll("#history-filters .pill");
        pills.forEach(pill => {
            pill.addEventListener("click", () => {
                pills.forEach(p => p.classList.remove("active"));
                pill.classList.add("active");
                currentFilter = pill.dataset.filter || "All";
                renderList();
            });
        });
    }

    /* ==================== Init ==================== */
    async function init() {
        renderStats();
        renderList();
        setupFilters();
        try { await openImagesDB(); await renderList(); } catch (error) { console.warn("Leave attachments unavailable.", error); }

        // When user returns from the create page (browser back / focus)
        window.addEventListener("storage", event => {
            if (event.key === LEAVES_KEY) { renderStats(); renderList(); }
        });
        window.addEventListener("pageshow", () => {
            renderStats();
            renderList();
        });


    }

    await init();
});
