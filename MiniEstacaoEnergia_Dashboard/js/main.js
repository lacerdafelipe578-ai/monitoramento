/**
 * js/main.js
 *
 * Controlador Principal de Navegação (SPA) E Menu Mobile.
 * (v2 - Adiciona lógica de Modo Visitante)
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- (NOVO) LÓGICA DE MODO VISITANTE ---
    const urlParams = new URLSearchParams(window.location.search);
    const IS_GUEST_MODE = urlParams.get('mode') === 'guest';

    if (IS_GUEST_MODE) {
        console.warn("Modo Visitante ATIVADO. Controlos e Configurações escondidos.");
        
        // 1. Esconder o link da aba "Configurações"
        const linkConfig = document.querySelector('.nav-link[data-page="page-configuracoes"]');
        if (linkConfig) {
            linkConfig.classList.add('hidden');
        }
        
        // 2. Esconder a secção de controlo de cargas (na aba Tempo Real)
        const secaoControle = document.getElementById('secao-controle-cargas');
        if (secaoControle) {
            secaoControle.classList.add('hidden');
        }
    }
    // --- FIM DA LÓGICA DE VISITANTE ---


    // --- 1. Seletores da Navegação ---
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page-content');

    // --- 2. Seletores do Menu Mobile ---
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const btnMenuMobile = document.getElementById('btn-menu-mobile');

    // --- 3. Função para mostrar/esconder a aba ---
    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.add('hidden');
        });
        const activePage = document.getElementById(pageId);
        if (activePage) {
            activePage.classList.remove('hidden');
        }
    }

    // --- 4. Funções para Abrir/Fechar o Menu Mobile ---
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
            
            // Fecha o menu mobile se estiver aberto
            closeMobileMenu(); 
        });
    });

    // Abrir menu com o botão hambúrguer
    if (btnMenuMobile) {
        btnMenuMobile.addEventListener('click', openMobileMenu);
    }

    // Fechar menu clicando no fundo escuro (backdrop)
    if (backdrop) {
        backdrop.addEventListener('click', closeMobileMenu);
    }

    // --- 6. Inicialização ---
    showPage('page-realtime'); // Mostra a primeira página

});
