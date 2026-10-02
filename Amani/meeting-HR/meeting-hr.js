
// =========================
// GET ELEMENTS
// =========================

const totalMeetings = document.getElementById("total-meetings");
const pendingMeetings = document.getElementById("pending-meetings");
const approvedToday = document.getElementById("approved-today");

const meetingList = document.getElementById("hr-meeting-list");
const emptyMeetings = document.getElementById("empty-meetings");

const statusFilter =
    document.getElementById("meeting-status-filter");

const searchInput =
    document.getElementById("meeting-search");

const scheduleForm =
    document.getElementById("schedule-form");

const scheduleEmployee =
    document.getElementById("schedule-employee");

const scheduleTopic =
    document.getElementById("schedule-topic");

const scheduleDate =
    document.getElementById("schedule-date");

const scheduleTime =
    document.getElementById("schedule-time");

const scheduleDuration =
    document.getElementById("schedule-duration");

const meetingLink =
    document.getElementById("meeting-link");

function eligibleMeetingEmployee(user) {
    const session = window.workspace.session();
    return session?.role === 'HR' && user.role === 'Employee'
        && String(user.id) !== String(session.id)
        && user.email?.toLowerCase() !== session.email?.toLowerCase();
}
scheduleEmployee.disabled = true;
document.addEventListener('DOMContentLoaded', async () => {
    await window.workspace.ready;
    window.workspace.users().filter(eligibleMeetingEmployee).forEach(user => {
        scheduleEmployee.add(new Option(`${user.name} — ${user.email}`, user.email));
    });
    scheduleEmployee.disabled = false;
    document.getElementById('open-schedule').addEventListener('click', () => {
        document.getElementById('schedule-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        scheduleEmployee.focus({ preventScroll: true });
    });
});


// =========================
// GET MEETINGS
// =========================

let meetings =
    JSON.parse(localStorage.getItem("meetings")) || [];


// =========================
// DISPLAY STATISTICS
// =========================

function displayStatistics() {

    totalMeetings.textContent = meetings.length;


    const pending = meetings.filter(function (meeting) {

        return meeting.status === "Pending";

    });

    pendingMeetings.textContent = pending.length;


    const today = new Date()
        .toISOString()
        .split("T")[0];


    const approved = meetings.filter(function (meeting) {

        return (
            meeting.status === "Confirmed" &&
            meeting.date === today
        );

    });

    approvedToday.textContent = approved.length;

}


// =========================
// DISPLAY MEETINGS
// =========================

function displayMeetings() {

    meetingList.innerHTML = "";


    const selectedStatus =
        statusFilter.value;

    const searchText =
        searchInput.value.toLowerCase().trim();


    const filteredMeetings =
        meetings.filter(function (meeting) {

            const statusMatch =
                selectedStatus === "all" ||
                meeting.status === selectedStatus;


            const employeeName =
                meeting.employeeName
                    ? meeting.employeeName.toLowerCase()
                    : "";


            const searchMatch =
                employeeName.includes(searchText);


            return statusMatch && searchMatch;

        });


    if (filteredMeetings.length === 0) {

        emptyMeetings.style.display = "block";

        return;

    }


    emptyMeetings.style.display = "none";


    for (let i = 0; i < filteredMeetings.length; i++) {

        const meeting =
            filteredMeetings[i];


        const row =
            document.createElement("tr");


        let actionHTML = "";


        // =========================
        // PENDING
        // =========================

        if (meeting.status === "Pending") {

            actionHTML = `

                <button
                    class="action-button"
                    onclick="approveMeeting(${meeting.id})"
                >
                    Approve
                </button>

                <button
                    class="action-button"
                    onclick="declineMeeting(${meeting.id})"
                >
                    Decline
                </button>

            `;

        }


        // =========================
        // CONFIRMED
        // =========================

        else if (meeting.status === "Confirmed") {

            actionHTML = `

                <button
                    class="action-button"
                    data-join-meeting
                >
                    Join Room
                </button>

            `;

        }


        // =========================
        // TABLE ROW
        // =========================

        row.innerHTML = `

            <td>
                <strong>
                    ${meeting.employeeName}
                </strong>
                <br>
                <small>
                    ${meeting.employeeEmail}
                </small>
            </td>

            <td>
                ${meeting.topic}
            </td>

            <td>
                ${meeting.date}
            </td>

            <td>
                ${meeting.time}
            </td>

            <td>

                <span class="status ${meeting.status.toLowerCase()}">

                    ${meeting.status}

                </span>

            </td>

            <td>

                ${actionHTML}

            </td>

        `;


        meetingList.appendChild(row);
        row.querySelector('[data-join-meeting]')?.addEventListener('click', () => joinMeeting(meeting.meetingLink));

    }

}


// =========================
// APPROVE MEETING
// =========================

function approveMeeting(id) {

    const meeting =
        meetings.find(function (meeting) {

            return meeting.id === id;

        });


    if (!meeting) {

        return;

    }


    const confirmed =
        confirm(
            "Approve this meeting request?"
        );


    if (!confirmed) {

        return;

    }


    // Generate unique Jitsi room

    const roomName =
        "Workforce-HR-" +
        meeting.id;


    const link =
        "https://meet.jit.si/" + roomName;


    meeting.status = "Confirmed";

    meeting.hrRepresentative =
        "HR Team";

    meeting.meetingLink =
        link;


    localStorage.setItem(
        "meetings",
        JSON.stringify(meetings)
    );


    alert(
        "Meeting approved successfully."
    );


    displayStatistics();

    displayMeetings();

}


// =========================
// DECLINE MEETING
// =========================

function declineMeeting(id) {

    const meeting =
        meetings.find(function (meeting) {

            return meeting.id === id;

        });


    if (!meeting) {

        return;

    }


    const confirmed =
        confirm(
            "Decline this meeting request?"
        );


    if (!confirmed) {

        return;

    }


    meeting.status = "Cancelled";


    localStorage.setItem(
        "meetings",
        JSON.stringify(meetings)
    );


    displayStatistics();

    displayMeetings();

}


// =========================
// JOIN JITSI MEETING
// =========================

function joinMeeting(link) {

    if (!link) {

        alert(
            "No meeting link is available."
        );

        return;

    }


    // Send the link to jitsi.js

    openJitsiMeeting(link);

}


// =========================
// SEARCH
// =========================

searchInput.addEventListener(
    "input",
    function () {

        displayMeetings();

    }
);


// =========================
// FILTER
// =========================

statusFilter.addEventListener(
    "change",
    function () {

        displayMeetings();

    }
);


// =========================
// SCHEDULE NEW MEETING
// =========================

scheduleForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const employee =
            scheduleEmployee.value;

        const topic =
            scheduleTopic.value.trim();

        const date =
            scheduleDate.value;

        const time =
            scheduleTime.value;

        const duration =
            scheduleDuration.value;


        if (
            employee === "" ||
            topic === "" ||
            date === "" ||
            time === ""
        ) {

            alert(
                "Please fill in all required fields."
            );

            return;

        }


        // Find employee data

        const employees =
            JSON.parse(
                localStorage.getItem("site_users")
            ) || [];


        const selectedEmployee =
            employees.find(function (user) {

                return user.email === employee;

            });

        if (!selectedEmployee || !eligibleMeetingEmployee(selectedEmployee)) {
            alert('Please select an employee other than yourself.');
            return;
        }


        // Create unique room

        const roomName =
            "Workforce-HR-" +
            Date.now();


        const generatedLink =
            "https://meet.jit.si/" +
            roomName;


        const newMeeting = {

            id: Date.now(),

            employeeName:
                selectedEmployee
                    ? selectedEmployee.name
                    : employee,

            employeeEmail:
                employee,

            topic:
                topic,

            reason:
                "Meeting scheduled by HR",

            date:
                date,

            time:
                time,

            duration:
                duration,

            hrRepresentative:
                window.workspace.session().name,

            status:
                "Confirmed",

            meetingLink:
                meetingLink.value.trim() || generatedLink,

            createdAt:
                new Date().toLocaleString()

        };


        meetings.push(newMeeting);


        localStorage.setItem(
            "meetings",
            JSON.stringify(meetings)
        );


        alert(
            "Meeting created successfully."
        );


        scheduleForm.reset();


        displayStatistics();

        displayMeetings();

    }
);


// =========================
// INITIAL DISPLAY
// =========================

displayStatistics();

displayMeetings();
