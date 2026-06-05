let allPosts = [];
let filteredPosts = []; // Nové pole pre vyhľadávané príspevky
let currentPage = 1;
const postsPerPage = 4;

// Pomocná funkcia: Vytvorí pekný link (slug) z názvu článku
function createSlug(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^\w\-]+/g, '')       
        .replace(/\-\-+/g, '-')         
        .replace(/^-+/, '')             
        .replace(/-+$/, '');            
}

// Načítanie dát
async function loadBlog() {
    try {
        const response = await fetch('articles.json');
        allPosts = await response.json();
        
        // Vygenerujeme slug pre každý článok
        allPosts.forEach(post => {
            post.slug = createSlug(post.title);
        });

        router(); // Zistíme, čo máme zobraziť
    } catch (error) {
        document.getElementById('older-container').innerHTML = '<p style="text-align:center; padding:20px;">Nepodarilo sa načítať články.</p>';
    }
}

// ROUTER: Zistí aktuálnu URL a podľa toho zapne vyhľadávanie, stranu alebo článok
function router() {
    const pathSegments = window.location.pathname.split('/').filter(segment => segment !== '');
    const lastSegment = pathSegments[pathSegments.length - 1] || '';
    
    // Zistíme, či je v URL vyhľadávanie (napr. ?q=beh)
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    // Aktualizujeme políčko s lupou
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = query || '';

    // Aplikujeme filter, ak nejaký je
    if (query) {
        const qLower = query.toLowerCase();
        filteredPosts = allPosts.filter(p => 
            p.title.toLowerCase().includes(qLower) || 
            p.content.toLowerCase().includes(qLower) ||
            p.author.toLowerCase().includes(qLower)
        );
    } else {
        filteredPosts = [...allPosts];
    }

    // Rozhodneme, čo zobraziť
    if (lastSegment === '' || lastSegment === 'index.html' || lastSegment.includes('github.io')) {
        currentPage = 1;
        showGrid();
        renderBlog();
    } else if (lastSegment.startsWith('page-')) {
        const pageNum = parseInt(lastSegment.split('-')[1]);
        currentPage = !isNaN(pageNum) ? pageNum : 1;
        showGrid();
        renderBlog();
    } else {
        // Hľadáme konkrétny článok
        const postIndex = allPosts.findIndex(p => p.slug === lastSegment);
        if (postIndex !== -1) {
            viewPost(postIndex);
        } else {
            currentPage = 1;
            showGrid();
            renderBlog();
        }
    }
}

// Vykresľovanie zoznamu
function renderBlog() {
    const featuredContainer = document.getElementById('featured-container');
    const olderContainer = document.getElementById('older-container');
    const pagination = document.querySelector('.pagination');

    if (filteredPosts.length === 0) {
        featuredContainer.style.display = 'block';
        featuredContainer.innerHTML = '<div style="text-align:center; padding: 60px 20px; background:var(--bg-card); border-radius:14px;"><h2 style="color: var(--text-muted);">Nenašli sa žiadne články pre tento výraz.</h2></div>';
        olderContainer.innerHTML = '';
        pagination.style.display = 'none';
        return;
    }

    // Ak sme na prvej strane a nevyhľadávame, prvý článok ukážeme ako veľký banner
    let postsToDisplay;
    const urlParams = new URLSearchParams(window.location.search);
    const isSearching = urlParams.has('q');

    if (currentPage === 1 && !isSearching) {
        const featured = filteredPosts[0];
        featuredContainer.style.display = 'block';
        featuredContainer.innerHTML = `
            <div class="featured-post" onclick="navigateTo('${featured.slug}')">
                <img src="${featured.image}" alt="${featured.title}">
                <div class="card-overlay">
                    <div class="post-date">Najnovší príspevok • ${featured.date}</div>
                    <h2 class="post-title">${featured.title}</h2>
                </div>
            </div>
        `;
        postsToDisplay = filteredPosts.slice(1);
    } else {
        // Na strane 2+ alebo pri vyhľadávaní veľký banner schováme, dáme všetko do mriežky
        featuredContainer.style.display = 'none';
        postsToDisplay = filteredPosts;
    }

    // Stránkovanie pre mriežku (Grid)
    const totalPages = Math.max(1, Math.ceil(postsToDisplay.length / postsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;
    
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const currentGridPosts = postsToDisplay.slice(startIndex, endIndex);

    olderContainer.innerHTML = '';
    currentGridPosts.forEach((post) => {
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

    if (totalPages <= 1) {
        pagination.style.display = 'none';
    } else {
        pagination.style.display = 'flex';
        document.getElementById('page-number').innerText = `${currentPage} / ${totalPages}`;
        document.getElementById('prev-btn').disabled = currentPage === 1;
        document.getElementById('next-btn').disabled = currentPage === totalPages;
    }
}

// Vyhľadávanie
function handleSearch(e) {
    e.preventDefault();
    const query = document.getElementById('search-input').value.trim();
    if (query) {
        navigateTo('?q=' + encodeURIComponent(query));
    } else {
        navigateTo(''); // Ak je prázdne, resetne na domovskú
    }
}

// Tlačidlá predchádzajúca/ďalšia strana
function changePage(direction) {
    const newPage = currentPage + direction;
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    
    let newPath = newPage === 1 ? '' : 'page-' + newPage;
    if (query) {
        newPath += '?q=' + encodeURIComponent(query);
    }
    
    navigateTo(newPath);
    window.scrollTo({top: 0, behavior: 'smooth'});
}

// Zmena URL bez refreshu
function navigateTo(slugOrPath) {
    const currentPath = window.location.pathname;
    const pathSegments = currentPath.split('/').filter(segment => segment !== '');
    const lastSegment = pathSegments[pathSegments.length - 1] || '';

    // Očistíme cestu od starého článku alebo page-X aby sme sa vrátili na "koreň" (root) repozitára
    const isKnownSegment = lastSegment === 'index.html' || lastSegment.startsWith('page-') || allPosts.some(p => p.slug === lastSegment);
    if (isKnownSegment && !lastSegment.includes('github.io')) {
        pathSegments.pop();
    }

    let basePath = '/' + pathSegments.join('/');
    if (!basePath.endsWith('/')) basePath += '/';

    const newUrl = basePath + slugOrPath;
    
    window.history.pushState({}, '', newUrl);
    router();
}

function viewPost(realIndex) {
    const post = allPosts[realIndex];
    document.getElementById('blog-layout').style.display = 'none';
    document.getElementById('back-btn').style.display = 'inline-block';
    
    const singlePost = document.getElementById('single-post');
    singlePost.style.display = 'block';
    
    document.getElementById('post-full-title').innerText = post.title;
    document.getElementById('post-full-meta').innerText = `Publikované: ${post.date} | Autor: ${post.author}`;
    document.getElementById('post-full-body').innerHTML = post.content;
    
    window.scrollTo({top: 0, behavior: 'smooth'});
    document.title = `${post.title} | Uličníci Behajú`;
}

function showGrid() {
    document.title = "Uličníci Behajú | Bežecký Blog";
    document.getElementById('single-post').style.display = 'none';
    document.getElementById('back-btn').style.display = 'none';
    document.getElementById('blog-layout').style.display = 'flex';
    document.getElementById('copy-btn').innerText = 'Skopírovať odkaz';
    document.getElementById('ig-btn').innerText = 'Instagram';
}

/* ZDIEĽANIE */
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
        document.getElementById('ig-btn').innerText = '✓ Odkaz skopírovaný!';
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

// Event listener pre tlačidlo Späť/Dopredu v prehliadači
window.addEventListener('popstate', router);

window.onload = loadBlog;
