const root=document.location.origin;

const leavesKey="site_leaves";
const sessionKey="site_session";

const leaveTypes=["Annual","Sick","Personal","Unpaid"];
const visitorPaths = ["/Ahmad/loginEmp/loginEmp"];


let employees = [];
function getData(key){
    let data=localStorage.getItem(key);
    return data?JSON.parse(data):null;
}

function saveData(key,data){
    localStorage.setItem(key,JSON.stringify(data));
}


/* ---------------- Employee helpers ---------------- */
async function loadEmployees() {
    try {
        const res = await fetch("/data/employees.json");
        if (!res.ok) throw new Error("Could not load employees.json");
        employees = await res.json();
    } catch (err) {
        console.log("Falling back to site_users:", err);
        employees = getData("site_users") || [];
    }
    return employees;
}

function getEmployee(id) {
    return employees.find(e => String(e.id) === String(id)) || null;
}

function getEmployeeByEmail(email) {
    return employees.find(e => String(e.email) === String(email)) || null;
}

function getEmployeeName(id) {
    const e = getEmployee(id);
    return e ? e.name : "Unknown Employee";
}

function getEmployeeRole(id) {
    const e = getEmployee(id);
    return e ? (e.position || e.role || "") : "";
}

function getEmployeeAvatar(id) {
    const e = getEmployee(id);
    if (e && e.image) return e.image;
    const name = e ? e.name : "Unknown";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0F4C3A&color=fff&bold=true`;
}

function getCurrentUser(){

    const session = getData(sessionKey);

    if(!session){
        return null;
    }

    return session;
}


saveData("site_users", [
    { id:"1", name:"Lina Haddad", email:"lina@workforce.example", position:"People & Culture Lead", department:"Human Resources", role:"Employee", phone:"+962 6 555 0101", location:"Amman, Jordan", image:"", bio:"" },
    { id:"2", name:"Julian Drake",      email:"julian@workforce.example", position:"Senior Software Engineer",  department:"Engineering",     role:"Employee", phone:"",                 location:"Berlin, Germany",  image:"", bio:"" },
    { id:"3", name:"Aria Montgomery",   email:"aria@workforce.example",   position:"Lead Product Designer",     department:"Design",          role:"Employee", phone:"",                 location:"London, UK",       image:"", bio:"" },
    { id:"4", name:"Siddharth Kumar",   email:"sid@workforce.example",    position:"Data Operations Lead",      department:"Data",            role:"Employee", phone:"",                 location:"Bangalore, India", image:"", bio:"" },
    { id:"5", name:"Marcus Vance",      email:"marcus@workforce.example", position:"Director of Brand Strategy", department:"Marketing",      role:"Employee", phone:"",                 location:"New York, USA",    image:"", bio:"" }
]);

saveData("site_session", {
    id:"1", name:"Lina Haddad", email:"lina@workforce.example",
    position:"People & Culture Lead", department:"Human Resources",
    role:"Employee", phone:"+962 6 555 0101", location:"Amman, Jordan",
    image:"", bio:""
});


let currentUser = null;
let isAdmin = false;
let isEmployee = false;

const pageAssets={
    header:{css:[],js:[]},
    footer:{css:[],js:[]},
    app:{css:[],js:[]}
};

function removeAssets(area){
    if(!pageAssets[area])return;

    pageAssets[area].css.forEach(link=>{
        if(link&&link.parentNode)link.remove();
    });

    pageAssets[area].js.forEach(script=>{
        if(script&&script.parentNode)script.remove();
    });

    pageAssets[area].css=[];
    pageAssets[area].js=[];
}

function showLoader(){
    const app=document.getElementById("app");
    if(!app)return;
    app.innerHTML=`
        <div class="page-loader">
            <div class="loader"></div>
        </div>
    `;
}

function hideLoader(){
    const loader=document.querySelector("#app .page-loader");
    if(loader)loader.remove();
}

async function loadPage(path,replace="app", isStatic = false){
    const app=document.getElementById(replace);

    if(!app)return;

    try{
        if(path===""||path==="/")path="Deyaa/HomePage";
        console.log("path", path);
        console.log("isAdmin", isAdmin);
        console.log("isEmployee", isEmployee);
        console.log("visitorPaths", visitorPaths.includes(path));
        console.log("isStatic", isStatic);
        console.log("");
        if(!isAdmin && !isEmployee && !visitorPaths.includes(path) && !isStatic){
            alert("Your Don't have permission to view this page please login");
        }


        if(replace==="app"){
            showLoader();
        }

        const mainPath=root+"/"+path.replace(/^\//,"");
        const response=await fetch(mainPath+".html");

        if(!response.ok)throw new Error("Page not found");

        const html=await response.text();

        removeAssets(replace);

        if(replace==="app"){
            await new Promise(resolve=>setTimeout(resolve,500));
        }

        app.innerHTML=html;

        const css=document.createElement("link");
        css.rel="stylesheet";
        css.href=mainPath+".css";
        css.dataset.pageAsset="true";
        css.dataset.area=replace;

        document.head.appendChild(css);
        pageAssets[replace].css.push(css);

        const script=document.createElement("script");
        script.src=mainPath+".js";
        script.dataset.pageAsset="true";
        script.dataset.area=replace;

        document.body.appendChild(script);
        pageAssets[replace].js.push(script);

    }catch(error){
        console.error("Router error:",error);

        removeAssets(replace);

        try{
            const response=await fetch(root+"/pages/404.html");

            if(!response.ok)throw new Error("404 page not found");

            app.innerHTML=await response.text();
        }catch(error){
            app.innerHTML="<h1>404</h1><p>Page not found.</p>";
        }
    }
}


async function loadLayout(){
    isAdmin=currentUser&&currentUser.role==="HR"?true:false;

    if(isAdmin){
        await loadPage("/Shared/hr_header","header", true);
    }else{
        await loadPage("/Shared/employee_header","header", true);
        await loadPage("/Shared/employee_footer","footer", true);
    }
}

async function init(){

    await loadEmployees();

    currentUser = getCurrentUser();

    console.log("currentUser:", currentUser);

    isAdmin = currentUser?.role === "HR";
    isEmployee = !!currentUser && !isAdmin;

    console.log("isAdmin:", isAdmin);
    console.log("isEmployee:", isEmployee);

    await loadLayout();

    const currentPath = window.location.pathname;

    if(isAdmin || isEmployee || visitorPaths.includes(currentPath)){
        await loadPage(currentPath, "app");
    }else{
        window.location.href = "/Ahmad/loginEmp/loginEmp";
    }
}

document.addEventListener("click",event=>{
    const link=event.target.closest(".load-page");

    if(!link)return;

    const href=link.getAttribute("href");

    if(!href||href.startsWith("http"))return;

    event.preventDefault();

    history.pushState(null,"",href);
    loadPage(href,"app");
});

window.addEventListener("popstate",()=>{
    loadPage(window.location.pathname,"app");
});

init();


window.addEventListener('load', function() {
    const loader = document.getElementById('loader');
    setTimeout(() => loader.style.opacity = '0', 300);
    setTimeout(() => loader.style.display = 'none', 700);
});


