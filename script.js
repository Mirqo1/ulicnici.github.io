let allPosts = [];
let currentPage = 1;
const postsPerPage = 4;

// 1. NAČÍTANIE BLOGU Z JSON SÚBORU
async function loadBlog() {
    try {
        const response = await fetch('articles.json');
        allPosts = await response.json();
        renderBlog();
    } catch (error) {
        const container = document.getElementById('older-container');
        if (container) {
            container.innerHTML = '<p>Nepodarilo sa načítať články. Uistite sa, že súbory sú správne nahraté.</p>';
        }
    }
}

// 2. VYKRESLENIE HLAVNEJ STRÁNKY (NAJNOVŠÍ + STARŠIE ČLÁNKY)
function renderBlog() {
    if (allPosts.length === 0) return;

    // Najnovší (veľký) článok
    const featured = allPosts[0];
    const featuredContainer = document.getElementById('featured-container');
    if (featuredContainer) {
        featuredContainer.innerHTML = `
            <div class="featured-post" onclick="viewPost(0)">
                <img src="${featured.image}" alt="${featured.title}">
                <div class="card-overlay">
                    <div class="post-date">Najnovší príspevok • ${featured.date}</div>
                    <h2 class="post-title">${featured.title}</h2>
                </div>
            </div>
        `;
    }

    // Staršie články (mriežka so stránkovaním)
    const olderPosts = allPosts.slice(1);
    const totalPages = Math.max(1, Math.ceil(olderPosts.length / postsPerPage));
    
    if (currentPage > totalPages) currentPage = totalPages;
    
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToDisplay = olderPosts.slice(startIndex, endIndex);

    const olderContainer = document.getElementById('older-container');
    if (olderContainer) {
        olderContainer.innerHTML = '';
        postsToDisplay.forEach((post, index) => {
            const realIndex = index + startIndex + 1;
            olderContainer.innerHTML += `
                <div class="older-card" onclick="viewPost(${realIndex})">
                    <img src="${post.image}" alt="${post.title}">
                    <div class="card-overlay">
                        <div class="post-date">${post.date}</div>
                        <h3 class="post-title">${post.title}</h3>
                    </div>
                </div>
            `;
        });
    }

    // Aktualizácia stavu stránkovania
    const pageNumElem = document.getElementById('page-number');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (pageNumElem) pageNumElem.innerText = `${currentPage} / ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

// 3. OVLÁDANIE STRÁNKOVANIA
function changePage(direction) {
    currentPage += direction;
    renderBlog();
    const olderContainer = document.getElementById('older-container');
    if (olderContainer) {
        olderContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

// 4. ZOBRAZENIE DETAILU ČLÁNKU
function viewPost(realIndex) {
    const post = allPosts[realIndex];
    
    const blogLayout = document.getElementById('blog-layout');
    const singlePost = document.getElementById('single-post');
    
    if (blogLayout) blogLayout.style.display = 'none';
    if (singlePost) singlePost.style.display = 'block';
    
    // Zobrazenie všetkých tlačidiel Späť (horné aj spodné)
    const backButtons = document.querySelectorAll('.back-btn');
    backButtons.forEach(btn => btn.style.display = 'block');
    
    // Naplnenie dátami
    const titleElem = document.getElementById('post-full-title');
    const metaElem = document.getElementById('post-full-meta');
    const bodyElem = document.getElementById('post-full-body');
    
    if (titleElem) titleElem.innerText = post.title;
    if (metaElem) metaElem.innerText = `Publikované: ${post.date} | Autor: ${post.author}`;
    if (bodyElem) bodyElem.innerHTML = post.content;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 5. NÁVRAT NA ZOZNAM ČLÁNKOV
function showGrid() {
    const blogLayout = document.getElementById('blog-layout');
    const singlePost = document.getElementById('single-post');
    
    if (blogLayout) blogLayout.style.display = 'flex';
    if (singlePost) singlePost.style.display = 'none';
    
    // Skrytie tlačidiel Späť
    const backButtons = document.querySelectorAll('.back-btn');
    backButtons.forEach(btn => btn.style.display = 'none');
    
    // Reset textov na tlačidlách zdieľania
    const copyBtn = document.getElementById('copy-btn');
    const igBtn = document.getElementById('ig-btn');
    
    if (copyBtn) copyBtn.innerText = 'Skopírovať odkaz';
    if (igBtn) igBtn.innerText = 'Instagram';
}
