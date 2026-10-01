fetch("team.json")
    .then(function(response) {
        return response.json();
    })
    .then(function(team) {

        const container =
            document.getElementById("teamContainer");

        team.forEach(function(member) {

            container.innerHTML += `

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