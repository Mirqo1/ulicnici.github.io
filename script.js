let allPosts = [];
let filteredPosts = []; 
let currentPage = 1;
const postsPerPage = 4;

function createSlug(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^\w\-]+/g, '')       
        .replace(/\-\-+/g, '-')         
        .replace(/^-+/, '')             
        .replace(/-+$/, '');            
}

function removeDiacritics(text) {
    return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
}

async function loadBlog() {
    try {
        const response = await fetch('articles.json');
        allPosts = await response.json();
        
        allPosts.forEach(post => {
            post.slug = createSlug(post.title);
        });

        router(); 
    } catch (error) {
        document.getElementById('older-container').innerHTML = '<p style="text-align:center; padding:20px;">Nepodarilo sa načítať články.</p>';
    }
}

function router() {
    const pathSegments = window.location.pathname.split('/').filter(segment => segment !== '');
    const lastSegment = pathSegments[pathSegments.length - 1] || '';
    
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = query || '';

if (query) {
        // Hľadaný výraz zmeníme na malé písmená a odstránime diakritiku
        const qClean = removeDiacritics(query.toLowerCase());

        filteredPosts = allPosts.filter(p => {
            // Texty článkov tiež zmeníme na malé písmená a očistíme od diakritiky
            const titleClean = removeDiacritics(p.title.toLowerCase());
            const contentClean = removeDiacritics(p.content.toLowerCase());
            const authorClean = removeDiacritics(p.author.toLowerCase());

            return titleClean.includes(qClean) || 
                   contentClean.includes(qClean) ||
                   authorClean.includes(qClean);
        });
    } else {
        filteredPosts = [...allPosts];
    }

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

function renderBlog() {
    const featuredContainer = document.getElementById('featured-container');
    const olderContainer = document.getElementById('older-container');
    const pagination = document.querySelector('.pagination');

    if (filteredPosts.length === 0) {
        featuredContainer.style.display = 'none';
        olderContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; padding: 60px 20px; background:var(--bg-card); border-radius:14px;"><h2 style="color: var(--text-muted);">Nenašli sa žiadne články pre tento výraz.</h2></div>';
        pagination.style.display = 'none';
        return;
    }

    // Najnovší (alebo najrelevantnejší vyhľadaný) článok sa VŽDY zobrazí v bannery + REKLAMA POD NÍM
    const featured = filteredPosts[0];
    const urlParams = new URLSearchParams(window.location.search);
    const isSearching = urlParams.has('q');
    const badgeText = isSearching ? 'Výsledok vyhľadávania' : 'Najnovší príspevok';

    featuredContainer.style.display = 'block';
    // Tu je správne umiestnený článok a pod ním banner pre reklamu
featuredContainer.innerHTML = `
        <div class="featured-post" onclick="navigateTo('${featured.slug}')">
            <img src="${featured.image}" alt="${featured.title}">
            <div class="card-overlay">
                <div class="post-date">${badgeText} • ${featured.date}</div>
                <h2 class="post-title">${featured.title}</h2>
            </div>
        </div>

        <!-- MIESTO PRE GOOGLE REKLAMU (PLACEHOLDER) -->
        <div style="margin: 30px auto 0 auto; max-width: 100%; height: 120px; background-color: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-weight: 500;">
            <div style="text-align: center;">
                <span style="display:block; font-size: 1.1rem; color: #6b7280; margin-bottom: 4px;">Tu bude Google reklama</span>
                <span style="font-size: 0.85rem;">(Horizontálny responzívny banner)</span>
            </div>
        </div>
    `;

    // Zvyšné články sa stránkujú v mriežke
    const olderPosts = filteredPosts.slice(1);
    const totalPages = Math.max(1, Math.ceil(olderPosts.length / postsPerPage));
    
    if (currentPage > totalPages) currentPage = totalPages;
    
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const currentGridPosts = olderPosts.slice(startIndex, endIndex);

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

function handleSearch(e) {
    e.preventDefault();
    const query = document.getElementById('search-input').value.trim();
    if (query) {
        navigateTo('?q=' + encodeURIComponent(query));
    } else {
        navigateTo(''); 
    }
}

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

function navigateTo(slugOrPath) {
    const currentPath = window.location.pathname;
    const pathSegments = currentPath.split('/').filter(segment => segment !== '');
    const lastSegment = pathSegments[pathSegments.length - 1] || '';

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
    // Odstráni HTML značky z textu a spočíta slová
    const textOnly = post.content.replace(/<[^>]*>?/gm, '');
    const wordCount = textOnly.split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200)); // 200 slov za minútu
    document.getElementById('blog-layout').style.display = 'none';
    document.getElementById('back-btn').style.display = 'inline-block';
    
    const singlePost = document.getElementById('single-post');
    singlePost.style.display = 'block';
    
    document.getElementById('post-full-title').innerText = post.title;
    document.getElementById('post-full-meta').innerHTML = `Publikované: ${post.date} &nbsp;|&nbsp; Autor: ${post.author} &nbsp;|&nbsp; ⏱️ Čítanie na ${readingTime} min.`;
    
    // Tu je správne vložený obsah článku a pod ním druhý reklamný banner
    document.getElementById('post-full-body').innerHTML = post.content + `
        <!-- MIESTO PRE GOOGLE REKLAMU (PLACEHOLDER) -->
        <div style="margin: 40px auto 0 auto; width: 100%; max-width: 700px; height: 250px; background-color: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-weight: 500;">
            <div style="text-align: center;">
                <span style="display:block; font-size: 1.1rem; color: #6b7280; margin-bottom: 4px;">Tu bude Google reklama</span>
                <span style="font-size: 0.85rem;">(In-article banner)</span>
            </div>
        </div>
    `;
    
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

window.addEventListener('popstate', router);
window.onload = loadBlog;
