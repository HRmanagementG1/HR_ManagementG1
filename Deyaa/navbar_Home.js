// =========================
// Get Current User
// =========================

const currentUser = JSON.parse(
    localStorage.getItem("currentUser")
);


// =========================
// Get Navbar Elements
// =========================

const navLinks = document.getElementById("navLinks");

const navActions = document.getElementById("navActions");


// =========================
// Check Current User
// =========================

if (currentUser) {


    // =========================
    // HR NAVBAR
    // =========================

    if (currentUser.role === "HR") {

        navLinks.innerHTML = `

            <li>
                <a href="HomePage.html">
                    Home
                </a>
            </li>

            <li>
                <a href="employees.html">
                    Employees
                </a>
            </li>

            <li>
                <a href="leave.html">
                    Leave Requests
                </a>
            </li>

            <li>
                <a href="feedback.html">
                    Feedback
                </a>
            </li>

            <li>
                <a href="tasks.html">
                    Tasks
                </a>
            </li>

        `;

    }


    // =========================
    // EMPLOYEE NAVBAR
    // =========================

    else if (currentUser.role === "Employee") {

        navLinks.innerHTML = `

            <li>
                <a href="HomePage.html">
                    Home
                </a>
            </li>

            <li>
                <a href="profile.html">
                    My Profile
                </a>
            </li>

            <li>
                <a href="leave.html">
                    My Leave
                </a>
            </li>

            <li>
                <a href="tasks.html">
                    My Tasks
                </a>
            </li>

            <li>
                <a href="HomePage.html#contact">
                    Contact HR
                </a>
            </li>

        `;

    }


    // =========================
    // USER ACTIONS
    // =========================

    navActions.innerHTML = `

        <span class="user-name">
            ${currentUser.name}
        </span>

        <button
            type="button"
            class="logout-btn"
            id="logoutBtn">

            Logout

        </button>

    `;


    // =========================
    // LOGOUT
    // =========================

    const logoutBtn =
        document.getElementById("logoutBtn");


    logoutBtn.addEventListener("click", function () {

        localStorage.removeItem("currentUser");

        window.location.href = "HomePage.html";

    });

}