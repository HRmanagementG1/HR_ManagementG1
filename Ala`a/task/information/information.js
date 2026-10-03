document.addEventListener("DOMContentLoaded", function () {

    // Get workspace
    const W = window.workspace;


    // Wait until workspace is ready
    W.ready.then(function () {


        // ================= GET CURRENT USER =================

        const session = W.session();

        if (!session) {
            return;
        }


        // Get all users
        const users = W.users();


        // Find the logged-in employee
        const user = users.find(function (person) {

            return String(person.id) === String(session.id);

        });


        // If employee does not exist
        if (!user) {

            document.querySelector(".main-container").textContent =
                "Employee record not found.";

            return;
        }



        // ================= EMPLOYEE ID =================

        let employeeId = user.employeeCode;

        if (!employeeId) {

            employeeId =
                "EMP-" + String(user.id).padStart(3, "0");

        }



        // ================= BASIC INFORMATION =================

        document.querySelector('[data-user="name"]').textContent =
            user.name || "Not provided";


        document.querySelector('[data-user="position"]').textContent =
            user.position || "Not provided";


        document.getElementById("recordStatus").textContent =
            employeeId + " · Active Employee";


        document.getElementById("departmentLocation").textContent =
            (user.department || "No department") +
            " · " +
            (user.location || "No location");



        // ================= EMPLOYEE INFORMATION CARDS =================

        document.querySelector('[data-info="employeeId"]').textContent =
            employeeId;


        document.querySelector('[data-info="email"]').textContent =
            user.email || "Not provided";


        document.querySelector('[data-info="phone"]').textContent =
            user.phone || "Not provided";


        document.querySelector('[data-info="location"]').textContent =
            user.location || "Not provided";



        // ================= EMPLOYEE AVATAR =================

        const avatar =
            document.getElementById("informationAvatar");


        const nameParts =
            user.name.split(" ");


        let initials =
            nameParts[0][0];


        if (nameParts.length > 1) {

            initials += nameParts[1][0];

        }


        avatar.textContent = initials;



        // If employee has an image
        if (user.image) {

            avatar.innerHTML =
                '<img src="' +
                user.image +
                '" alt="' +
                user.name +
                '">';

        }



        // ================= PHONE EDIT =================

        const editPhone =
            document.getElementById("editPhone");


        const phoneForm =
            document.getElementById("phoneForm");


        const phoneInput =
            document.getElementById("phoneInput");


        const cancelPhone =
            document.getElementById("cancelPhone");


        const phoneMessage =
            document.getElementById("phoneMessage");



        // Click Edit
        editPhone.onclick = function () {

            phoneInput.value =
                user.phone || "";

            phoneForm.hidden = false;

            editPhone.hidden = true;

            phoneInput.focus();

        };



        // Click Cancel
        cancelPhone.onclick = function () {

            phoneForm.hidden = true;

            editPhone.hidden = false;

            phoneMessage.textContent = "";

        };



        // Save phone
        phoneForm.onsubmit = function (event) {

            event.preventDefault();


            const newPhone =
                phoneInput.value.trim();


            if (newPhone === "") {

                phoneMessage.textContent =
                    "Please enter a phone number.";

                return;

            }


            // Update user
            user.phone = newPhone;


            // Save users in localStorage
            W.save("site_users", users);


            // Update page
            document.querySelector(
                '[data-info="phone"]'
            ).textContent = newPhone;


            phoneForm.hidden = true;

            editPhone.hidden = false;

            phoneMessage.textContent =
                "Phone number saved.";

        };



        // ================= SALARY =================

        const salary =
            Number(user.salary);


        const annualSalary =
            document.getElementById("annualSalary");


        const monthlySalary =
            document.getElementById("monthlySalary");


        if (!isNaN(salary)) {

            annualSalary.textContent =
                "$" +
                salary.toLocaleString() +
                " USD";


            monthlySalary.textContent =
                "$" +
                (salary / 12).toFixed(2) +
                " / mo";

        }
        else {

            annualSalary.textContent =
                "Not provided";


            monthlySalary.textContent =
                "—";

        }



        // ================= HIDE / SHOW SALARY =================

        const salaryButton =
            document.getElementById("toggleSalary");


        let salaryHidden = false;


        salaryButton.onclick = function () {

            salaryHidden =
                !salaryHidden;


            if (salaryHidden) {

                annualSalary.textContent =
                    "••••••";


                monthlySalary.textContent =
                    "••••••";

            }
            else {

                annualSalary.textContent =
                    "$" +
                    salary.toLocaleString() +
                    " USD";


                monthlySalary.textContent =
                    "$" +
                    (salary / 12).toFixed(2) +
                    " / mo";

            }

        };



        // ================= PERFORMANCE =================

        const performance =
            user.performance;


        if (performance) {


            document.querySelector(
                ".quarter-badge"
            ).textContent =
                performance.period;


            document.querySelector(
                ".score-big"
            ).textContent =
                performance.score;


            document.querySelector(
                ".rating-stars-text strong"
            ).textContent =
                performance.summary;


            document.querySelector(
                ".bonus-badge"
            ).textContent =
                performance.bonus;



            // Performance progress values

            const progressItems =
                document.querySelectorAll(
                    ".progress-item"
                );


            const values = [
                performance.collaboration,
                performance.leadership,
                performance.initiative,
                performance.policy
            ];


            progressItems.forEach(
                function (item, index) {

                    if (values[index] != null) {

                        const value =
                            Number(values[index]);


                        item.querySelector(
                            "strong"
                        ).textContent =
                            value + " / 5.0";


                        item.querySelector(
                            ".progress-fill"
                        ).style.width =
                            (value / 5 * 100) + "%";

                    }

                }
            );

        }



        // ================= CREDENTIAL =================

        const dialog =
            document.getElementById(
                "credentialDialog"
            );


        const credentialDetails =
            document.getElementById(
                "credentialDetails"
            );


        const credentialButton =
            document.getElementById(
                "credentialButton"
            );


        const closeCredential =
            document.getElementById(
                "closeCredential"
            );


        // Open credential
        credentialButton.onclick =
            function () {

                credentialDetails.textContent =
                    user.name +
                    " · " +
                    employeeId +
                    " · " +
                    user.email;


                dialog.showModal();

            };


        // Close credential
        closeCredential.onclick =
            function () {

                dialog.close();

            };


    });

});