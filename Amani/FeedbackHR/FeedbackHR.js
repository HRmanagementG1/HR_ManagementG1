
// =========================
// GET ELEMENTS
// =========================

const totalFeedback =
    document.querySelector(".stat-card:nth-child(1) .stat-number");

const unreadFeedback =
    document.querySelector(".stat-card:nth-child(2) .stat-number");

const kudosFeedback =
    document.querySelector(".stat-card:nth-child(3) .stat-number");

const feedbackList =
    document.querySelector(".feedback-list");

const searchInput =
    document.querySelector(".feedback-search");

const filters =
    document.querySelectorAll(".filter");


// =========================
// GET FEEDBACK
// =========================

let feedbacks =
    JSON.parse(localStorage.getItem("feedback")) || [];


// =========================
// DISPLAY STATISTICS
// =========================

function displayStatistics() {

    const total = feedbacks.length;

    const unread =
        feedbacks.filter(function (feedback) {
            return feedback.read === false;
        }).length;

    const kudos =
        feedbacks.filter(function (feedback) {
            return feedback.topic === "Kudos";
        }).length;


    totalFeedback.textContent = total;

    unreadFeedback.textContent = unread;

    kudosFeedback.textContent = kudos;
}


// =========================
// DISPLAY FEEDBACK
// =========================

function displayFeedback(data = feedbacks) {

    feedbackList.innerHTML = "";


    if (data.length === 0) {

        feedbackList.innerHTML = `
            <p style="text-align:center;">
                No feedback found.
            </p>
        `;

        return;
    }


    for (let i = 0; i < data.length; i++) {

        const feedback = data[i];


        let initials = "AE";

        if (feedback.name) {

            const words =
                feedback.name.split(" ");

            initials =
                words
                    .map(function (word) {
                        return word[0];
                    })
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();
        }


        let typeClass = "suggestion";

        if (feedback.topic === "Kudos") {
            typeClass = "kudos";
        }

        if (feedback.topic === "Support") {
            typeClass = "support";
        }


        const status =
            feedback.read ? "Reviewed" : "◉ Unread";


        const feedbackCard =
            document.createElement("div");

        feedbackCard.className =
            "feedback-card";


        feedbackCard.innerHTML = `

            <div class="feedback-top">

                <div class="employee-info">

                    <div class="avatar">
                        ${initials}
                    </div>

                    <div>

                        <h3>
                            ${feedback.name || "Anonymous Employee"}
                        </h3>

                        <span>
                            Employee • Submitted
                            ${feedback.date || ""}
                        </span>

                    </div>

                </div>


                <span class="feedback-type ${typeClass}">
                    ${feedback.topic}
                </span>

            </div>


            <p class="feedback-message">
                "${feedback.message}"
            </p>


            <div class="feedback-bottom">

                <span class="status ${feedback.read ? "reviewed" : "unread"}">
                    ${status}
                </span>


                <div class="feedback-actions">

                    ${
                        !feedback.read
                        ?
                        `<button onclick="markAsRead(${feedback.id})">
                            Mark as Read
                        </button>`
                        :
                        ""
                    }


                    <button onclick="replyByEmail('${feedback.email}')">
                        Reply via Email
                    </button>


                    ${
                        !feedback.read
                        ?
                        `<button onclick="assignToHR(${feedback.id})">
                            Assign to HR Lead
                        </button>`
                        :
                        ""
                    }

                </div>

            </div>
        `;


        feedbackList.appendChild(feedbackCard);
    }
}


// =========================
// MARK AS READ
// =========================

function markAsRead(id) {

    const feedback =
        feedbacks.find(function (feedback) {
            return feedback.id === id;
        });


    if (!feedback) {
        return;
    }


    feedback.read = true;


    localStorage.setItem(
        "feedback",
        JSON.stringify(feedbacks)
    );


    displayStatistics();

    displayFeedback(feedbacks);
}


// =========================
// REPLY BY EMAIL
// =========================

function replyByEmail(email) {

    if (!email) {

        alert("Email address not available.");

        return;
    }


    window.location.href =
        "mailto:" + email;
}


// =========================
// ASSIGN TO HR
// =========================

function assignToHR(id) {

    const feedback =
        feedbacks.find(function (feedback) {
            return feedback.id === id;
        });


    if (!feedback) {
        return;
    }


    feedback.assignedTo = "HR Lead";


    localStorage.setItem(
        "feedback",
        JSON.stringify(feedbacks)
    );


    alert("Feedback assigned to HR Lead.");
}


// =========================
// SEARCH
// =========================

searchInput.addEventListener(
    "input",
    function () {

        const searchText =
            searchInput.value
                .toLowerCase()
                .trim();


        const filtered =
            feedbacks.filter(function (feedback) {

                return (
                    (feedback.name || "")
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    (feedback.message || "")
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    (feedback.topic || "")
                        .toLowerCase()
                        .includes(searchText)
                );
            });


        displayFeedback(filtered);
    }
);


// =========================
// FILTERS
// =========================

filters.forEach(function (filter) {

    filter.addEventListener(
        "click",
        function () {

            filters.forEach(function (button) {
                button.classList.remove("active");
            });


            filter.classList.add("active");


            const filterText =
                filter.textContent
                    .toLowerCase()
                    .trim();


            let filtered = feedbacks;


            if (filterText.startsWith("all")) {

                filtered = feedbacks;

            }


            else if (filterText.startsWith("unread")) {

                filtered =
                    feedbacks.filter(function (feedback) {

                        return feedback.read === false;

                    });

            }


            else if (filterText.startsWith("anonymous")) {

                filtered =
                    feedbacks.filter(function (feedback) {

                        return (
                            !feedback.name ||
                            feedback.name === "Anonymous Employee"
                        );

                    });

            }


            else if (filterText.startsWith("support")) {

                filtered =
                    feedbacks.filter(function (feedback) {

                        return feedback.topic === "Support";

                    });

            }


            else if (filterText.startsWith("kudos")) {

                filtered =
                    feedbacks.filter(function (feedback) {

                        return feedback.topic === "Kudos";

                    });

            }


            displayFeedback(filtered);
        }
    );

});


// =========================
// INITIAL DISPLAY
// =========================

displayStatistics();

displayFeedback();