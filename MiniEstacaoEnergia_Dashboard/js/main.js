/**
 * js/main.js
 *
 * Controlador Principal de Navegação (SPA) E Menu Mobile.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Seletores da Navegação ---
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page-content');

    // --- 2. (NOVO) Seletores do Menu Mobile ---
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const btnMenuMobile = document.getElementById('btn-menu-mobile');

    // --- 3. Função para mostrar/esconder a aba (igual a antes) ---
    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.add('hidden');
        });
        const activePage = document.getElementById(pageId);
        if (activePage) {
            activePage.classList.remove('hidden');
        }
    }

    // --- 4. (NOVO) Funções para Abrir/Fechar o Menu Mobile ---
    function openMobileMenu() {
        if (sidebar) sidebar.classList.remove('-translate-x-full');
        if (backdrop) backdrop.classList.remove('hidden');
    }

    function closeMobileMenu() {
        if (sidebar) sidebar.classList.add('-translate-x-full');
        if (backdrop) backdrop.classList.add('hidden');
    }

    // --- 5. Adiciona "Ouvintes" de Eventos ---

    // Navegação principal (clicar nos links da sidebar)
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Impede o link de recarregar a página
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            link.classList.add('active');
            
            const pageIdToShow = link.getAttribute('data-page');
            showPage(pageIdToShow);
            
            // (NOVO) Fecha o menu mobile se estiver aberto
            closeMobileMenu(); 
        });
    });

    // (NOVO) Abrir menu com o botão hambúrguer
    if (btnMenuMobile) {
        btnMenuMobile.addEventListener('click', openMobileMenu);
    }

    // (NOVO) Fechar menu clicando no fundo escuro (backdrop)
    if (backdrop) {
        backdrop.addEventListener('click', closeMobileMenu);
    }

    // --- 6. Inicialização ---
    showPage('page-realtime'); // Mostra a primeira página

});
