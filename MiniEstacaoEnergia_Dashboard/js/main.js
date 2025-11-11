/**
 * js/main.js
 *
 * Controlador Principal de Navegação (SPA - Single-Page Application).
 *
 * Responsabilidades:
 * 1. Ouvir cliques nos links da barra de navegação ('.nav-link').
 * 2. Esconder todas as seções de conteúdo ('.page-content').
 * 3. Mostrar apenas a seção de conteúdo correspondente ao link clicado.
 * 4. Atualizar o estilo 'active' no link de navegação.
 */

// Espera o DOM (a página HTML) carregar completamente antes de rodar o script.
document.addEventListener('DOMContentLoaded', () => {

    // 1. Seleciona todos os links de navegação
    const navLinks = document.querySelectorAll('.nav-link');

    // 2. Seleciona todas as seções de conteúdo (as "abas")
    const pages = document.querySelectorAll('.page-content');

    // 3. Função para mostrar a página correta
    function showPage(pageId) {
        // Esconde todas as páginas
        pages.forEach(page => {
            page.classList.add('hidden');
        });

        // Mostra apenas a página com o ID correto
        const activePage = document.getElementById(pageId);
        if (activePage) {
            activePage.classList.remove('hidden');
        }
    }

    // 4. Adiciona o "ouvinte" de clique em cada link da navegação
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Impede o link de recarregar a página (comportamento padrão do #)

            // Remove a classe 'active' de todos os links
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });

            // Adiciona a classe 'active' apenas no link clicado
            link.classList.add('active');

            // Pega o ID da página alvo (armazenado no atributo 'data-page')
            const pageIdToShow = link.getAttribute('data-page');
            
            // Chama a função para mostrar a página correspondente
            showPage(pageIdToShow);
        });
    });

    // 5. Garante que a primeira página (Tempo Real) seja mostrada ao carregar
    // (O 'active' já está no HTML, mas garantimos o 'show' aqui)
    showPage('page-realtime');

});