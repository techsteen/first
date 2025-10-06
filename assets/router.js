const routes = new Map();

export function defineRoute(path, render) {
    routes.set(path, render);
}

function handleNavigation() {
    const hash = window.location.hash.replace('#', '') || '/';
    const path = hash.startsWith('/') ? hash : `/${hash}`;
    const view = routes.get(path);
    const app = document.getElementById('app');

    if (!app) return;

    if (view) {
        view(app);
    } else {
        app.innerHTML = `
            <section class="learning-card">
                <h2>Side ikke fundet</h2>
                <p>Den ønskede side findes ikke. Gå tilbage til forsiden.</p>
                <a class="button" href="#/">Til forsiden</a>
            </section>`;
    }

    app.focus({ preventScroll: true });
    updateActiveLinks(path);
}

function updateActiveLinks(path) {
    document.querySelectorAll('[data-route]').forEach(link => {
        if (link.getAttribute('href') === `#${path}`) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

export function initRouter() {
    window.addEventListener('hashchange', handleNavigation);
    document.addEventListener('DOMContentLoaded', () => {
        handleNavigation();
    });
}

initRouter();
