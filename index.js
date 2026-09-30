const root = document.location.origin;
const app = document.getElementById("app");

const pageAssets = {
    css: [],
    js: []
};

async function loadPage(path) {

    try {

        // =========================
        // 1. Load HTML
        // =========================

        if(path == "" || path == "/"){
            path = "Deyaa/HomePage";
        }
        const mainPath = root + "/" +  path.replace(/^\//, "")
        
        const url = mainPath + ".html";
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Page not found");
        }

        const html = await response.text();

        app.innerHTML = html;


        // =========================
        // 2. Remove old page CSS
        // =========================

        pageAssets.css.forEach(link => {
            link.remove();
        });

        pageAssets.css = [];


        // =========================
        // 3. Remove old page JS
        // =========================

        pageAssets.js.forEach(script => {
            script.remove();
        });

        pageAssets.js = [];


        // =========================
        // 4. Load new CSS
        // =========================

        const css = document.createElement("link");

        css.rel = "stylesheet";
        css.href = mainPath + ".css";

        css.dataset.pageAsset = "true";

        document.head.appendChild(css);

        pageAssets.css.push(css);


        // =========================
        // 5. Load new JS
        // =========================

        const script = document.createElement("script");

        script.src = mainPath + ".js";

        script.dataset.pageAsset = "true";

        document.body.appendChild(script);

        pageAssets.js.push(script);


    } catch (error) {

        console.error("Router error:", error);

        // Remove previous page assets
        pageAssets.css.forEach(link => link.remove());
        pageAssets.js.forEach(script => script.remove());

        pageAssets.css = [];
        pageAssets.js = [];


        // Load 404
        try {

            const response = await fetch(root + "/pages/404.html");

            if (!response.ok) {
                throw new Error("404 page not found");
            }

            app.innerHTML = await response.text();

        } catch (error) {

            app.innerHTML = `
                <h1>404</h1>
                <p>Page not found.</p>
            `;
        }
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
