(() => {
    const { getData, saveData } = window.employeeWorkspace;
    const currentUser = window.employeeWorkspace.getCurrentUser();
    const LEAVES_KEY = (typeof leavesKey !== "undefined") ? leavesKey : "site_leaves";
    const leaveTypes = ["Annual", "Sick", "Personal", "Unpaid"];

    let employees = [];
    let selectedFiles = [];
    let imagesDB = null;

    const fileInput    = document.getElementById("myfile");
    const imagePreview = document.getElementById("imagePreview");
    const form         = document.getElementById("leave-form");

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

    function saveImagesForLeave(leaveId, files) {
        return new Promise((resolve, reject) => {
            const tx = imagesDB.transaction("images", "readwrite");
            const store = tx.objectStore("images");
            files.forEach((file, i) => {
                store.put({
                    id: `${leaveId}_${i}`,
                    leaveId: leaveId,
                    name: file.name,
                    type: file.type,
                    blob: file,
                    createdAt: Date.now()
                });
            });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    /* ==================== Employees ==================== */

    function showEmployee() {
        const select = document.getElementById("employee");
        select.innerHTML = "";

        if (!currentUser) {
            select.innerHTML = `<option value="">Please log in</option>`;
            return;
        }

        const me = employees.find(e => String(e.id) === String(currentUser.id));
        const name     = me ? me.name : currentUser.name;
        const position = me ? me.position : (currentUser.position || "");

        const option = document.createElement("option");
        option.value = currentUser.id;
        option.textContent = position ? `${name} - ${position}` : name;
        option.selected = true;
        select.appendChild(option);
    }

    function showLeaveTypes() {
        const select = document.getElementById("type");
        select.innerHTML = `<option value="">Select Type</option>`;
        leaveTypes.forEach(type => {
            const option = document.createElement("option");
            option.value = type;
            option.textContent = type;
            select.appendChild(option);
        });
    }

    /* ==================== Messages ==================== */
    function showMessage(message, isSuccess = false) {
        const box = document.getElementById("form-result");
        if (!box) return;
        box.classList.remove("success", "error");
        box.classList.add(isSuccess ? "success" : "error");
        box.textContent = message;
        box.style.display = "block";
    }

    /* ==================== Validation ==================== */
    function validateLeave(employee, type, start, end, reason) {
        if (!employee) return "Please select an employee.";
        if (!type) return "Please select a leave type.";
        if (!leaveTypes.includes(type)) return "Invalid leave type.";
        if (!start || !end) return "Please select start and end dates.";
        if (end < start) return "End date must be on or after start date.";
        if (reason.trim().length < 5) return "Please enter a reason with at least 5 characters.";
        if (reason.trim().length > 1000) return "Reason must not exceed 1000 characters.";
        return "";
    }

    /* ==================== Setup ==================== */
    function setupDates() {
        const start = document.getElementById("start");
        const end   = document.getElementById("end");

        const today = new Date().toISOString().slice(0, 10);
        start.min = today;
        end.min = today;

        start.addEventListener("change", () => {
            end.min = start.value;
            if (end.value && end.value < start.value) {
                end.value = start.value;
            }
        });
    }

    function setupReasonCounter() {
        const reason  = document.getElementById("reason");
        const counter = document.getElementById("reason-count");
        reason.addEventListener("input", () => {
            counter.textContent = reason.value.length;
        });
    }

    /* ==================== File upload ==================== */
    fileInput.addEventListener("change", function () {
        const files = Array.from(this.files);

        files.forEach(file => {
            if (!file.type.startsWith("image/")) return;
            if (file.size > 10 * 1024 * 1024) {
                alert(`${file.name} is larger than 10MB`);
                return;
            }

            const exists = selectedFiles.some(
                f => f.name === file.name && f.size === file.size
            );
            if (!exists) selectedFiles.push(file);
        });

        renderImages();
        fileInput.value = "";
    });

    function renderImages() {
        imagePreview.innerHTML = "";

        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const item = document.createElement("div");
                item.className = "image-item";
                item.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button type="button" class="image-delete" data-index="${index}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                `;
                imagePreview.appendChild(item);
            };
            reader.readAsDataURL(file);
        });
    }

    imagePreview.addEventListener("click", (e) => {
        const btn = e.target.closest(".image-delete");
        if (!btn) return;
        const index = Number(btn.dataset.index);
        selectedFiles.splice(index, 1);
        renderImages();
    });

    /* ==================== Submit ==================== */
    function setupForm() {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (!currentUser) {
                showMessage("Please log in first.");
                return;
            }

            const employee = document.getElementById("employee").value;
            const type     = document.getElementById("type").value;
            const start    = document.getElementById("start").value;
            const end      = document.getElementById("end").value;
            const reason   = document.getElementById("reason").value;

            const error = validateLeave(employee, type, start, end, reason);
            if (error) {
                showMessage(error);
                return;
            }

            const leaves = getData(LEAVES_KEY) || [];
            const newId  = leaves.length
                ? Math.max(...leaves.map(l => Number(l.id))) + 1
                : 1;

            // Save images to IndexedDB
            let imageNames = [];
            if (selectedFiles.length > 0) {
                try {
                    await saveImagesForLeave(newId, selectedFiles);
                    imageNames = selectedFiles.map(f => f.name);
                } catch (err) {
                    console.log(err);
                    showMessage("Failed to save images.");
                    return;
                }
            }

            const leaveObj = {
                id: newId,
                owner: currentUser.id,
                type, start, end, reason,
                status: "Pending",
                images: imageNames
            };

            leaves.push(leaveObj);
            saveData(LEAVES_KEY, leaves);

            showMessage("Your leave application was submitted successfully. Redirecting...", true);

            setTimeout(() => {
                window.location.href = new URL("employee_leave.html", window.location.href).href;
            }, 1200);
        });
    }

    /* ==================== Init ==================== */
    async function init() {
        try { await openImagesDB(); } catch (e) { console.log(e); }

        employees = await window.employeeWorkspace.loadEmployees();
        showEmployee();
        showLeaveTypes();
        setupDates();
        setupReasonCounter();
        setupForm();

        if (!currentUser) {
            showMessage("Please log in first before submitting a leave request.");
        }
    }

    init();
})();