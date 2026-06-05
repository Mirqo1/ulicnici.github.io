let allPosts = [];
let currentPage = 1;
const postsPerPage = 4;

// 1. Pomocná funkcia: Vytvorí pekný link (slug) z názvu článku
function createSlug(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Medzery nahradí pomlčkou
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Odstráni diakritiku (dĺžne, mäkčene)
        .replace(/[^\w\-]+/g, '')       // Odstráni špeciálne znaky
        .replace(/\-\-+/g, '-')         // Odstráni viacnásobné pomlčky
        .replace(/^-+/, '')             // Očistí začiatok
        .replace(/-+$/, '');            // Očistí koniec
}

// 2. Načítanie JSON a spustenie routera
async function loadBlog() {
    try {
        const response = await fetch('articles.json');
        allPosts = await response.json();
        
        // Vygenerujeme slug pre každý článok
        allPosts.forEach(post => {
            post.slug = createSlug(post.title);
        });

        // Hneď ako máme dáta, zistíme, čo máme zobraziť (podľa URL)
        router();
    } catch (error) {
        document.getElementById('older-container').innerHTML = '<p>Nepodarilo sa načítať články. Uistite sa, že súbory sú prítomné.</p>';
    }
}

// 3. Router - zisťuje, aká je URL a podľa toho zapína článok alebo zoznam
function router() {
    // Zistíme poslednú časť URL adresy
    const pathSegments = window.location.pathname.split('/').filter(segment => segment !== '');
    const lastSegment = pathSegments[pathSegments.length - 1];

    // Ak je URL prázdna, alebo je tam len index.html (sme na domovskej stránke)
    if (!lastSegment || lastSegment === 'index.html' || lastSegment.includes('github.io')) {
        showGrid();
        renderBlog();
    } else {
        // Hľadáme článok, ktorý má rovnaký slug ako je v URL
        const postIndex = allPosts.findIndex(p => p.slug === lastSegment);
        if (postIndex !== -1) {
            viewPost(postIndex, false); // false znamená, že už nemusíme meniť URL, lebo tam už je
        } else {
            // Ak link neexistuje, hodíme ho na domovskú stránku
            showGrid();
            renderBlog();
        }
    }
}

// 4. Funkcia pre zmenu URL bez refreshu stránky
function navigateTo(slug) {
    // Vytvoríme novú URL na základe cesty, kde sa aktuálne nachádzame
    const currentPath = window.location.pathname;
    let basePath = currentPath;
    
    // Očistíme cestu od starého článku, ak nejaký v URL bol
    if (slug === '') {
        // Návrat na domovskú (odstránime posledný segment URL)
        const pathSegments = currentPath.split('/').filter(segment => segment !== '');
        if (pathSegments.length > 0 && allPosts.some(p => p.slug === pathSegments[pathSegments.length - 1])) {
            pathSegments.pop();
            basePath = '/' + pathSegments.join('/');
            if(basePath !== '/') basePath += '/';
        }
    } else {
        // Ideme na článok
        if(!basePath.endsWith('/')) basePath += '/';
    }

    const newUrl = slug === '' ? basePath : basePath + slug;
    
    window.history.pushState({}, '', newUrl);
    router();
}

// Ochrana - ak používateľ klikne na tlačidlo "Späť" vo svojom prehliadači
window.addEventListener('popstate', router);


// -- PÔVODNÉ FUNKCIE (Upravené len volania onClick) --

function renderBlog() {
    if (allPosts.length === 0) return;

    const featured = allPosts[0];
    const featuredContainer = document.getElementById('featured-container');
    // ZMENA: namiesto viewPost(0) používame navigateTo()
    featuredContainer.innerHTML = `
        <div class="featured-post" onclick="navigateTo('${featured.slug}')">
            <img src="${featured.image}" alt="${featured.title}">
            <div class="card-overlay">
                <div class="post-date">Najnovší príspevok • ${featured.date}</div>
                <h2 class="post-title">${featured.title}</h2>
            </div>
        </div>
    `;

    const olderPosts = allPosts.slice(1);
    const totalPages = Math.max(1, Math.ceil(olderPosts.length / postsPerPage));
    
    if (currentPage > totalPages) currentPage = totalPages;
    
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToDisplay = olderPosts.slice(startIndex, endIndex);

    const olderContainer = document.getElementById('older-container');
    olderContainer.innerHTML = '';

    postsToDisplay.forEach((post, index) => {
        const realIndex = index + startIndex + 1;
        // ZMENA: namiesto viewPost() používame navigateTo()
        olderContainer.innerHTML += `
            <div class="older-card" onclick="navigateTo('${post.slug}')">
                <img src="${post.image}" alt="${post.title}">
                <div class="card-overlay">
                    <div class="post-date">${post.date}</div>
                    <h3 class="post-title">${post.title}</h3>
                </div>
            </div>
        `;
    });

    document.getElementById('page-number').innerText = `${currentPage} / ${totalPages}`;
    document.getElementById('prev-btn').disabled = currentPage === 1;
    document.getElementById('next-btn').disabled = currentPage === totalPages;
}

function changePage(direction) {
    currentPage += direction;
    renderBlog();
    document.getElementById('older-container').scrollIntoView({ behavior: 'smooth' });
}

function viewPost(realIndex, pushToHistory = true) {
    const post = allPosts[realIndex];
    document.getElementById('blog-layout').style.display = 'none';
    document.getElementById('back-btn').style.display = 'block';
    
    const singlePost = document.getElementById('single-post');
    singlePost.style.display = 'block';
    
    document.getElementById('post-full-title').innerText = post.title;
    document.getElementById('post-full-meta').innerText = `Publikované: ${post.date} | Autor: ${post.author}`;
    document.getElementById('post-full-body').innerHTML = post.content;
    
    window.scrollTo({top: 0, behavior: 'smooth'});

    // Dynamicky upravíme meta title stránky
    document.title = `${post.title} | Uličníci`;
}

function showGrid() {
    document.title = "Uličníci Behajú | Bežecký Blog";
    document.getElementById('single-post').style.display = 'none';
    document.getElementById('back-btn').style.display = 'none';
    document.getElementById('blog-layout').style.display = 'flex';
    document.getElementById('copy-btn').innerText = 'Skopírovať odkaz';
    document.getElementById('ig-btn').innerText = 'Instagram';
}

/* FUNKCIE PRE ZDIEĽANIE */
function shareFacebook() {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
}

function shareX() {
    const url = window.location.href;
    const text = document.getElementById('post-full-title').innerText;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
}

function shareInstagram() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        const igBtn = document.getElementById('ig-btn');
        igBtn.innerText = '✓ Odkaz skopírovaný!';
        setTimeout(() => { window.open('https://www.instagram.com/', '_blank'); }, 1000);
    }).catch(() => { window.open('https://www.instagram.com/', '_blank'); });
}

function copyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        document.getElementById('copy-btn').innerText = '✓ Skopírované!';
    }).catch(() => {
        alert('Nepodarilo sa skopírovať odkaz automaticky.');
    });
}

// Spustenie po načítaní
window.onload = loadBlog;
