function setupOnThisPageIntercepts() {
    let activeLink = null;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const id = entry.target.getAttribute('id');
            if (!id) return;
            const navLink = document.getElementById(`toc-${id}`);
            if (!navLink) return;

            if (entry.isIntersecting) {
                if (activeLink) {
                    activeLink.classList.remove('active');
                }
                navLink.classList.add('active');
                activeLink = navLink;
            }
        });
    }, {
        threshold: 0, rootMargin: "0px 0px -90% 0px"
    });

    document.querySelectorAll('#content h1, #content h2, #content h3, #content h4, #content h5, #content h6').forEach(section => {
        observer.observe(section);
    });
}

(function () {
    setupOnThisPageIntercepts();
})();