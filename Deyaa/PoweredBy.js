(async () => {
  const container = document.getElementById("teamContainer");
  try {
    const response = await fetch("team.json");
    if (!response.ok) throw new Error("Team data unavailable");
    const team = await response.json();
    for (const member of team) {
      const card = document.createElement("article");
      card.className = "team-card";
      const portrait = document.createElement("div");
      portrait.className = "team-portrait";
      portrait.setAttribute("aria-hidden", "true");
      portrait.textContent = member.name
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0])
        .join("");
      // Keep initials as a fallback if a portrait cannot load.
      if (member.portraitAvailable && member.image) {
        const image = new Image();

        image.alt = member.name;
        image.onload = () => {
          portrait.removeAttribute("aria-hidden");
          portrait.replaceChildren(image);
        };
        image.src = new URL(
          "../" + member.image.replace(/^\//, ""),
          location.href,
        );
      }
      const name = document.createElement("h2");
      name.textContent = member.name;
      const role = document.createElement("h3");
      role.textContent = member.role;
      const description = document.createElement("p");
      description.textContent = member.description;
      card.append(portrait, name, role, description);
      container.append(card);
    }
  } catch (error) {
    container.textContent =
      "Team details could not load. Please refresh to try again.";
    container.setAttribute("role", "alert");
  }
})();
