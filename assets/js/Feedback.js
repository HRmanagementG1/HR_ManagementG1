
// =========================
// GET HTML ELEMENTS
// =========================
console.log("contact.js is working");

const form = document.getElementById("feedback-form");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const topicInput = document.getElementById("topic");
const messageInput = document.getElementById("message");


// =========================
// GET OLD FEEDBACKS
// =========================

let feedbacks =JSON.parse(localStorage.getItem("feedback")) || [];


// =========================
// FORM SUBMIT
// =========================

form.addEventListener("submit", function (event) {

    // Prevent page refresh
    event.preventDefault();


    // Get values from inputs
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const topic = topicInput.value;
    const message = messageInput.value.trim();


    // =========================
    // VALIDATION
    // =========================

    if (name === "") {
        alert("Please enter your name.");
        return;
    }

    if (email === "") {
        alert("Please enter your email.");
        return;
    }

    if (message === "") {
        alert("Please enter your message.");
        return;
    }


    // =========================
    // CREATE FEEDBACK OBJECT
    // =========================

    const feedback = {
        name: name,
        email: email,
        topic: topic,
        message: message
    };


    // =========================
    // ADD NEW FEEDBACK
    // =========================

    feedbacks.push(feedback);


    // =========================
    // SAVE TO LOCAL STORAGE
    // =========================

    localStorage.setItem(
        "feedback",
        JSON.stringify(feedbacks)
    );


    // =========================
    // SUCCESS MESSAGE
    // =========================

    alert("Your message has been submitted successfully.");


    // =========================
    // CLEAR FORM
    // =========================

    form.reset();

});