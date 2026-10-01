//<!-- Scroll animation -->
const items = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('show');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach(el => io.observe(el));

fetch("navbar_Home.html")
    .then(response => response.text())
    .then(data => {
        document.getElementById("navbar").innerHTML = data;
    });

    fetch("footer.html")
    .then(response => response.text())
    .then(data => {
        document.getElementById("FOOTER").innerHTML = data;
    });