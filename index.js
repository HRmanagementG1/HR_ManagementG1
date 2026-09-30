const root = document.location.origin;
const app = document.getElementById("app");

async function loadPage(path) {
    

    if(path == "" || path == "/"){
        path = "Deyaa/HomePage";
    }
    const page = path.replace(/^\//, "") + ".html";
    app.innerHTML = `
        <div class="loading">
            Loading...
        </div>
    `;
    
    history.pushState(null, "", path);
    try {
        const response = await fetch(root + "/" + page);
        if (!response.ok) {
            throw new Error("error loading page");
        }
        const html = await response.text();

        app.innerHTML = html;

    } catch (error) {
        console.error("Router error:", error);
    }
}


document.addEventListener("click", event => {

    const link = event.target.closest(".load-page");

    if (!link) {
        return;
    }

    const href = link.getAttribute("href");

    if (!href || href.startsWith("http")) {
        return;
    }
    event.preventDefault();
    loadPage(href);
});

window.addEventListener("popstate", () => {
    loadPage(window.location.pathname);
});

loadPage(window.location.pathname);
