
fetch("team.json")

    .then(response => response.json())
    .then(team => {

        localStorage.setItem("team", JSON.stringify(team));
        const teamContainer =document.getElementById("teamContainer");

        team.forEach(member => {

            teamContainer.innerHTML += `

                <div class="team-card">

                    <img
                        src="${member.image}"
                        alt="${member.name}"
                    >

                    <h2>
                        ${member.name}
                    </h2>

                    <h3>
                        ${member.role}
                    </h3>

                    <p>
                        ${member.description}
                    </p>

                </div>

            `;

        });

    });
    const team = JSON.parse(localStorage.getItem("team"));