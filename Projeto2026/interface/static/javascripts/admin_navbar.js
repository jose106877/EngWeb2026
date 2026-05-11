document.addEventListener("DOMContentLoaded", function () {

    const hamburger = document.getElementById("hamburger");
    const mobileMenu = document.getElementById("mobileMenu");

    if (hamburger) {
        hamburger.addEventListener("click", function () {

            mobileMenu.classList.toggle("w3-show");

        });
    }

    /* Active page highlight */

    const links = document.querySelectorAll(".nav-links a, #mobileMenu a");
    const currentPath = window.location.pathname;

    links.forEach(link => {

        const linkPath = new URL(link.href).pathname;

        if (linkPath === currentPath) {
            link.classList.add("active-page");
        }

    });

});