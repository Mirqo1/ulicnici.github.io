// 1. Databáza článkov (tu si budeš pridávať texty a obrázky)
const articlesData = [
    {
        slug: 'vylet-do-tatier', // Toto bude svietiť v linku: www.web.sk/vylet-do-tatier
        title: 'Náš víkendový výlet do Tatier',
        date: '15. Jún 2026',
        excerpt: 'Krásne počasie, náročný výstup a nezabudnuteľné výhľady. Prečítajte si, ako sme zvládli Kriváň.',
        content: `
            <p>Tento víkend sme sa rozhodli zdolať jeden z našich najkrajších štítov. Cesta začala skoro ráno...</p>
            <p>Počasie nám prialo a výhľady boli úžasné. Určite sa sem ešte vrátime.</p>
        `
    },
    {
        slug: 'ako-zariadit-dodavku',
        title: 'Ako sme si prerobili dodávku na karavan',
        date: '2. Máj 2026',
        excerpt: 'Trvalo to tri mesiace, stálo to veľa nervov, ale výsledok stojí za to.',
        content: `
            <p>Všetko to začalo kúpou starej dodávky. V tomto článku vám ukážeme postup krok za krokom, ako sme ju zateplili a vstavali do nej nábytok.</p>
            <p>Najťažšia bola elektrika, ale nakoniec všetko funguje ako má.</p>
        `
    }
];

// 2. Hlavný kontajner, kam budeme vkladať HTML
const appContainer = document.getElementById('app');

// 3. Funkcia na vykreslenie zoznamu článkov (Domovská stránka)
function renderHome() {
    let html = '';
    articlesData.forEach(article => {
        html += `
            <article class="article-card">
                <h2>${article.title}</h2>
                <p class="article-date">${article.date}</p>
                <p>${article.excerpt}</p>
                <!-- Kliknutie zavolá funkciu navigateTo -->
                <button class="read-more" onclick="navigateTo('/${article.slug}')">Čítať ďalej</button>
            </article>
        `;
    });
    appContainer.innerHTML = html;
}

// 4. Funkcia na vykreslenie konkrétneho článku
function renderArticle(slug) {
    // Nájdeme článok podľa slug-u v URL
    const article = articlesData.find(a => a.slug === slug);

    if (article) {
        appContainer.innerHTML = `
            <div class="single-article">
                <a href="/" class="back-btn" data-link>&larr; Späť na zoznam</a>
                <h1>${article.title}</h1>
                <p class="article-date">${article.date}</p>
                <div class="article-content">
                    ${article.content}
                </div>
            </div>
        `;
    } else {
        // Ak niekto zadá zlý link
        appContainer.innerHTML = `
            <div class="single-article">
                <h1>Článok sa nenašiel</h1>
                <p>Ospravedlňujeme sa, ale tento článok neexistuje.</p>
                <a href="/" class="read-more" data-link>Späť domov</a>
            </div>
        `;
    }
}

// 5. Router - Rozhoduje, čo sa má zobraziť podľa aktuálnej URL
function router() {
    // Získame cestu z URL (napr. "/vylet-do-tatier" a odstránime prvé lomítko)
    let path = window.location.pathname.replace(/^\/|\/$/g, '');

    // Ak testuješ lokálne priamo otváraním súboru, path môže byť "index.html"
    if (path === '' || path === 'index.html') {
        renderHome();
    } else {
        renderArticle(path);
    }
}

// 6. Funkcia na zmenu URL adresy bez načítania stránky
function navigateTo(url) {
    // Zmení URL v prehliadači
    window.history.pushState(null, null, url);
    // Spustí router aby vykreslil správny obsah
    router();
}

// 7. Odchytenie kliknutí na odkazy (aby sa stránka nenačítavala znova)
document.addEventListener('click', e => {
    if (e.target.matches('[data-link]')) {
        e.preventDefault();
        navigateTo(e.target.getAttribute('href'));
    }
});

// 8. Podpora pre tlačidlá Späť / Dopredu v prehliadači
window.addEventListener('popstate', router);

// 9. Prvé spustenie pri načítaní stránky
router();
