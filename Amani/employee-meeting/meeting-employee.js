
// =========================
// GET ELEMENTS
// =========================

const meetingForm = document.getElementById("meeting-form");

const meetingTopic = document.getElementById("meeting-topic");
const meetingReason = document.getElementById("meeting-reason");
const meetingDate = document.getElementById("meeting-date");
const meetingTime = document.getElementById("meeting-time");

const characterCount = document.getElementById("character-count");

const upcomingMeeting = document.getElementById("upcoming-meeting");

const statusFilter = document.getElementById("status-filter");
const meetingHistory = document.getElementById("meeting-history");
const emptyHistory = document.getElementById("empty-history");


// =========================
// GET LOGGED-IN USER
// =========================

const loggedInUser =
    window.employeeWorkspace.getCurrentUser();


// =========================
// GET SAVED MEETINGS
// =========================

let meetings =
    JSON.parse(localStorage.getItem("meetings")) || [];


// =========================
// CHARACTER COUNT
// =========================

meetingReason.addEventListener("input", function () {

    characterCount.textContent =
        meetingReason.value.length + "/500";

});


// =========================
// REQUEST MEETING
// =========================

meetingForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const topic = meetingTopic.value;
    const reason = meetingReason.value.trim();
    const date = meetingDate.value;
    const time = meetingTime.value;


    // Check login

    if (!loggedInUser) {

        alert("Please login first.");

        return;
    }


    // Check reason

    if (reason === "") {

        alert("Please enter the reason for your meeting.");

        return;
    }


    // Create meeting object

    const meeting = {

        id: Date.now(),

        employeeName: loggedInUser.name,

        employeeEmail: loggedInUser.email,

        topic: topic,

        reason: reason,

        date: date,

        time: time,

        hrRepresentative: "Not assigned yet",

        status: "Pending",

        meetingLink: "",

        createdAt: new Date().toLocaleString()

    };


    // Add meeting to array

    meetings.push(meeting);


    // Save to localStorage

    localStorage.setItem(
        "meetings",
        JSON.stringify(meetings)
    );


    // Show message

    alert("Your meeting request has been submitted successfully.");


    // Clear form

    meetingForm.reset();

    characterCount.textContent = "0/500";


    // Update page

    displayMeetings();

    displayUpcomingMeeting();

});


// =========================
// DISPLAY MEETING HISTORY
// =========================

function displayMeetings() {

    meetingHistory.innerHTML = "";

    const selectedStatus = statusFilter.value;


    // Filter meetings

    let filteredMeetings = meetings.filter(function (meeting) {

        if (selectedStatus === "all") {

            return true;

        }

        return meeting.status === selectedStatus;

    });


    // No meetings

    if (filteredMeetings.length === 0) {

        emptyHistory.style.display = "block";

        return;

    }


    emptyHistory.style.display = "none";


    // Display meetings

    for (let i = 0; i < filteredMeetings.length; i++) {

        const meeting = filteredMeetings[i];


        const row = document.createElement("tr");


        // Meeting link

        let linkHTML = "—";

        if (meeting.meetingLink !== "") {

            linkHTML =
                `<a 
                    href="${meeting.meetingLink}" 
                    target="_blank"
                    class="meeting-link"
                >
                    Join Meeting
                </a>`;

        }


        // Action button

        let actionHTML = "—";

        if (meeting.status === "Pending") {

            actionHTML =
                `<button 
                    class="action-button"
                    onclick="cancelMeeting(${meeting.id})"
                >
                    Cancel
                </button>`;

        }


        row.innerHTML = `

            <td>${meeting.topic}</td>

            <td>${meeting.date}</td>

            <td>${meeting.time}</td>

            <td>${meeting.hrRepresentative}</td>

            <td>
                <span class="status ${meeting.status.toLowerCase()}">
                    ${meeting.status}
                </span>
            </td>

            <td>
                ${linkHTML}
            </td>

            <td>
                ${actionHTML}
            </td>

        `;


        meetingHistory.appendChild(row);

    }

}


// =========================
// FILTER
// =========================

statusFilter.addEventListener("change", function () {

    displayMeetings();

});


// =========================
// CANCEL MEETING
// =========================

function cancelMeeting(id) {

    const confirmed =
        confirm("Are you sure you want to cancel this meeting request?");


    if (!confirmed) {

        return;

    }


    meetings = meetings.map(function (meeting) {

        if (meeting.id === id) {

            meeting.status = "Cancelled";

        }

        return meeting;

    });


    // Save changes

    localStorage.setItem(
        "meetings",
        JSON.stringify(meetings)
    );


    // Refresh page

    displayMeetings();

    displayUpcomingMeeting();

}


// =========================
// UPCOMING MEETING
// =========================

function displayUpcomingMeeting() {

    upcomingMeeting.innerHTML = "";


    const confirmedMeeting = meetings.find(function (meeting) {

        return meeting.status === "Confirmed";

    });


    // No confirmed meeting

    if (!confirmedMeeting) {

        upcomingMeeting.innerHTML = `

            <p class="no-meeting">
                You don't have an upcoming meeting.
            </p>

        `;

        return;

    }


    // Display confirmed meeting

    upcomingMeeting.innerHTML = `

        <div>

            <h3>${confirmedMeeting.topic}</h3>

            <p>
                <strong>Date:</strong>
                ${confirmedMeeting.date}
            </p>

            <p>
                <strong>Time:</strong>
                ${confirmedMeeting.time}
            </p>

            <p>
                <strong>HR Representative:</strong>
                ${confirmedMeeting.hrRepresentative}
            </p>

            ${
                confirmedMeeting.meetingLink
                ?
                `
                <a 
                    href="${confirmedMeeting.meetingLink}"
                    target="_blank"
                    class="meeting-link"
                >
                    Join Meeting
                </a>
                `
                :
                ""
            }

        </div>

    `;

}


// =========================
// INITIAL DISPLAY
// =========================

displayMeetings();

displayUpcomingMeeting();