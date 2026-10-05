document.addEventListener("DOMContentLoaded", async function () {
    await window.workspace.ready;
    if (!window.workspace.requireRole("Employee")) return;

    const feedbackEscape = value => window.workspace.escape(value);

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
    // POPUP ELEMENTS
    // =========================

    const successPopup =
        document.getElementById("success-popup");

    const closeSuccessPopup =
        document.getElementById("close-success-popup");

    const popupTitle =
        successPopup.querySelector("h3");

    const popupMessage =
        successPopup.querySelector("p");

    const popupIcon =
        successPopup.querySelector(".success-icon");


    // =========================
    // SHOW POPUP
    // =========================

    function showPopup(title, text, icon = "✓") {

        popupTitle.textContent =
            title;

        popupMessage.textContent =
            text;

        popupIcon.textContent =
            icon;

        successPopup.classList.add("show");

    }


    // =========================
    // CLOSE POPUP
    // =========================

    closeSuccessPopup.addEventListener(
        "click",
        function () {

            successPopup.classList.remove("show");

        }
    );


    // =========================
    // GET LOGGED-IN USER
    // =========================

    const loggedInUser =
        window.employeeWorkspace.getCurrentUser();


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

                showPopup(
                    "Login Required",
                    "Please login first.",
                    "!"
                );

                return;

            }


            const selectedTopic =
                topic.value;

            const messageText =
                message.value.trim();


            // Check message

            if (messageText === "") {

                showPopup(
                    "Message Required",
                    "Please enter your message.",
                    "!"
                );

                return;

            }


            // Create feedback

            const feedback = {

                id: Date.now(),
                employeeId: loggedInUser.id,

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

            feedbacks = window.workspace.read("feedback", []);
            feedbacks.push(feedback);


            // Save feedback

            localStorage.setItem(
                "feedback",
                JSON.stringify(feedbacks)
            );


            // Success message

            showPopup(
                "Feedback Submitted!",
                "Your feedback has been submitted successfully.",
                "✓"
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
                        feedback.employeeId != null ? String(feedback.employeeId) === String(loggedInUser.id) : feedback.email?.toLowerCase() === loggedInUser.email?.toLowerCase()
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
                            ${feedbackEscape(feedback.topic)}
                        </span>

                        <h3>
                            ${feedbackEscape(feedback.message)}
                        </h3>

                    </div>


                    <span class="feedback-status ${status.toLowerCase()}">
                        ${status}
                    </span>

                </div>


                <div class="feedback-card-footer">

                    <span>
                        Submitted: ${feedbackEscape(feedback.date)}
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

});