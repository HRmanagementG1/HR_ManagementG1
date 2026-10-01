
// =========================
// GET ELEMENTS
// =========================

const form =
    document.getElementById("feedback-form");

const employeeName =
    document.getElementById("employee-name");

const employeeEmail =
    document.getElementById("employee-email");

const topic =
    document.getElementById("topic");

const message =
    document.getElementById("message");

const feedbackHistoryList =
    document.getElementById("feedback-history-list");

const noFeedback =
    document.getElementById("no-feedback");


// =========================
// GET LOGGED-IN USER
// =========================

const loggedInUser =
    JSON.parse(
        localStorage.getItem("loggedInUser")
    );


// =========================
// DISPLAY USER INFORMATION
// =========================

if (loggedInUser) {

    employeeName.textContent =
        loggedInUser.name;

    employeeEmail.textContent =
        loggedInUser.email;

} else {

    employeeName.textContent =
        "Unknown employee";

    employeeEmail.textContent =
        "No email available";

}


// =========================
// GET FEEDBACK
// =========================

let feedbacks =
    JSON.parse(
        localStorage.getItem("feedback")
    ) || [];


// =========================
// SUBMIT FEEDBACK
// =========================

form.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        // Check login

        if (!loggedInUser) {

            alert(
                "Please login first."
            );

            return;

        }


        const selectedTopic =
            topic.value;

        const messageText =
            message.value.trim();


        // Check message

        if (messageText === "") {

            alert(
                "Please enter your message."
            );

            return;

        }


        // Create feedback

        const feedback = {

            id: Date.now(),

            name:
                loggedInUser.name,

            email:
                loggedInUser.email,

            topic:
                selectedTopic,

            message:
                messageText,

            date:
                new Date().toLocaleString(),

            read:
                false

        };


        // Add feedback

        feedbacks.push(feedback);


        // Save feedback

        localStorage.setItem(
            "feedback",
            JSON.stringify(feedbacks)
        );


        // Success message

        alert(
            "Your feedback has been submitted successfully."
        );


        // Clear form

        form.reset();


        // Refresh history

        displayFeedbackHistory();

    }
);


// =========================
// DISPLAY FEEDBACK HISTORY
// =========================

function displayFeedbackHistory() {

    feedbackHistoryList.innerHTML = "";


    // User is not logged in

    if (!loggedInUser) {

        noFeedback.style.display =
            "block";

        return;

    }


    // Get only current user's feedback

    const myFeedbacks =
        feedbacks.filter(
            function (feedback) {

                return (
                    feedback.email ===
                    loggedInUser.email
                );

            }
        );


    // No feedback

    if (myFeedbacks.length === 0) {

        noFeedback.style.display =
            "block";

        return;

    }


    noFeedback.style.display =
        "none";


    // Display feedback

    for (
        let i = 0;
        i < myFeedbacks.length;
        i++
    ) {

        const feedback =
            myFeedbacks[i];


        const feedbackCard =
            document.createElement("div");


        feedbackCard.className =
            "feedback-history-card";


        const status =
            feedback.read
                ? "Read"
                : "New";


        feedbackCard.innerHTML = `

            <div class="feedback-card-header">

                <div>

                    <span class="feedback-topic">
                        ${feedback.topic}
                    </span>

                    <h3>
                        ${feedback.message}
                    </h3>

                </div>


                <span class="feedback-status ${status.toLowerCase()}">
                    ${status}
                </span>

            </div>


            <div class="feedback-card-footer">

                <span>
                    Submitted: ${feedback.date}
                </span>

            </div>

        `;


        feedbackHistoryList.appendChild(
            feedbackCard
        );

    }

}


// =========================
// INITIAL DISPLAY
// =========================

displayFeedbackHistory();