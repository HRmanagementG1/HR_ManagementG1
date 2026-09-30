(() => { 
// global vars
let currentUser = null;
let isAdmin = false;
let employees = [];

let leavesKey = "site_leaves";
let usersKey = "site_users";
let sessionKey = "site_session";

const leaveTypes = ["Annual", "Sick", "Personal", "Unpaid"];

// global functions

function getData(key) {
    let data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// to be deleted when go live ...

saveData("site_users", [{id: 1,name:"wessam", session: "1_wessam"}]);
saveData("site_session", {id: 1,name:"wessam", session: "1_wessam"});

saveData("site_leaves", [
    {
        id: 1,
        owner: 1,
        type: "Annual",
        start: "2026-10-05",
        end: "2026-10-07",
        reason: "I need to take a short vacation to spend time with my family.",
        status: "Pending"
    },
    {
        id: 2,
        owner: 1,
        type: "Sick",
        start: "2026-09-20",
        end: "2026-09-21",
        reason: "I was feeling unwell and needed time to recover.",
        status: "Approved"
    }
]);

async function loadEmployees() {
    try {
        const response = await fetch("/employees.json");
        if (!response.ok) {
            throw new Error("Could not load employees.json");
        }
        const data = await response.json();
        employees = data;
        return employees;

    } catch (error) {
        console.log(error);
    }
}

function getCurrentUser() {
    let session = getData(sessionKey);
    if (!session) {
        return null;
    }
    let users = getData(usersKey);
    
    for (i = 0; i < users.length; i++) {
        if (users[i].id == session.id) {
            return users[i];
        }
    }
    return null;
}


function showEmployeesList(){
    let select = document.getElementById("employee");
    select.innerHTML = "";

    if(employees.length <= 0) return;
    employees.forEach((employee) => {
        if(employee.id == currentUser.id){
            option = document.createElement("option");
            option.value = employee.id;
            option.textContent = employee.name + " - " + employee.position;
            select.appendChild(option);
        }
    });
}



function showLeaveTypes(){
    let select = document.getElementById("type");
    select.innerHTML = "";

    option = document.createElement("option");
    option.value = "";
    option.textContent = "Select Type";
    select.appendChild(option);

    leaveTypes.forEach((type) => {
        option = document.createElement("option");
        option.value = type;
        option.textContent = type;
        select.appendChild(option);
    });
}


function showMessage(message, isSuccess = false) {

    let resultBox = document.getElementById("form-result");

    if (resultBox) {
        resultBox.style.display = "none";
        if (isSuccess) {
            resultBox.classList.remove("error");
            resultBox.classList.add("success");
        }else{
            resultBox.classList.remove("success");
            resultBox.classList.add("error");
        }
        resultBox.textContent = message;
        resultBox.style.display = "block";
    }
}

function validateLeave(employee, type, start, end, reason) {
    if (employee == "") {
        return "Please select an employee.";
    }

    let founded = false;
    employees.forEach((employeeObj) => {
        if(employeeObj.id === employee){
            founded = true;
        }
    });
    if (!founded) {
        return "Employee Not Founded.";
    }
    
    if (type == "") {
        return "Please select leave type.";
    }
    founded = false;

    leaveTypes.forEach((typeItem) => {
        if(type === typeItem){
            founded = true;
        }
    });
    if (!founded) {
        return "Type Not Founded.";
    }
    
    if (start == "" || end == "") {
        return "Please select start and end dates.";
    }

    if (end < start) {
        return "End date must be after start date.";
    }

    if (reason.trim().length < 5) {
        return "Please enter a reason with at least 5 characters.";
    }

    if (reason.trim().length > 1000) {
        return "Please enter a reason with no more than 1000 characters.";
    }

    return "";
}



function setupDates() {
    let start = document.getElementById("start");
    let end = document.getElementById("end");

    if (!start || !end) {
        return;
    }
    start.addEventListener("change", function() {
            end.min = start.value;
            if (end.value < start.value) {
                end.value = start.value;
            }
        }
    );
}

function setupReasonCounter() {
    let reason = document.getElementById("reason");

    let counter = document.getElementById("reason-count");

    if (!reason || !counter) {
        return;
    }

    reason.addEventListener("input", function() {
            counter.textContent = reason.value.length;
        }
    );
}


function setupForm() {

    let form = document.getElementById("leave-form");
    if (!form) return;

    form.addEventListener("submit",
        function(event) {
            event.preventDefault();

            if (!currentUser) {
                showMessage("Please log in first.");
                return;
            }

            let employee = document.getElementById("employee").value;


            let type = document.getElementById("type").value;


            let start = document.getElementById("start").value;


            let end = document.getElementById("end").value;


            let reason = document.getElementById("reason").value;


            let error = validateLeave(employee, type, start, end, reason);

            if (error) {
                showMessage(error);
                return;
            }



            let leaves = getData(leavesKey);
            let leaveObj = {
                id: leaves.length,
                owner: currentUser.id,
                type: type,
                start: start,
                end: end,
                reason: reason,
                status: "Pending"
            }
            leaves.push(leaveObj);
            saveData("site_leaves", leaves);

            console.log(leaves);
            form.reset();

            document.getElementById("employee").value = currentUser.id;
            document.getElementById("reason-count").textContent = "0";

            showMessage("Your leave application was submitted successfully.", true);

            showRequests();

        }
    );
}

function calculateDays(start, end) {
    let startDate = new Date(start);

    let endDate = new Date(end);


    let difference = endDate - startDate;


    let days = difference / (1000 * 60 * 60 * 24);

    return days + 1;
}


function showRequests() {
    let list = document.getElementById("leave-list");
    let count = document.getElementById("request-count");
    let pendingCount = document.getElementById("pending-count");

    let leaves = getData(leavesKey);
    let myLeaves = [];

    let pending = 0;

    let i;

    let days;

    let html = "";


    if (currentUser) {
        for (i = 0; i < leaves.length; i++) {
            if (leaves[i].owner == currentUser.id) {
                myLeaves.push(leaves[i]);
            }
        }
    }

    if (count) {
        count.textContent = myLeaves.length;
    }

    for (i = 0; i < myLeaves.length; i++) {
        if (myLeaves[i].status == "Pending") {
            pending++;
        }
    }

    if (pendingCount) {
        pendingCount.textContent = pending + " pending";
    }

    if (myLeaves.length == 0) {
        list.innerHTML =`
            <div class="empty">
            No leave applications yet.
            <br>
            Your submitted requests will appear here.
            </div>`;
        return;
    }


    for (i = myLeaves.length - 1; i >= 0; i--) {
        days = calculateDays(myLeaves[i].start, myLeaves[i].end);

        html += `
        <article class="leave-record">

            <div class="spread">

                <div>

                    <h3>
                        ${myLeaves[i].type} leave
                    </h3>

                    <div class="leave-meta">
                        ${myLeaves[i].start}
                        -
                        ${myLeaves[i].end}
                        -
                        ${days}
                        day(s)
                    </div>

                </div>

                <span class="status ${myLeaves[i].status == 'Approved' ? 'approved' : ''}">
                    ${myLeaves[i].status}
                </span>

            </div>

            <p>
                ${myLeaves[i].reason}
            </p>

        </article>
    `;
    }

    list.innerHTML = html;
}


// start app 

async function init() {

    currentUser = getCurrentUser();
    console.log(currentUser);
    if(currentUser.role == "admin"){
        alert();
    }

    employees = await loadEmployees();

    showEmployeesList();
    showLeaveTypes();
    setupDates();
    setupReasonCounter();
    setupForm();
    showRequests();

    if (!currentUser) {
        showMessage("Please log in first before submitting a leave request.");
    }
}


init();

})();