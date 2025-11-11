/**
 * js/relatorios.js
 *
 * Controlador da Aba "Relatórios".
 *
 * Responsabilidades:
 * 1. Ouvir os cliques nos botões "Gerar PDF" e "Gerar CSV".
 * 2. Mostrar um alerta de "Função não implementada".
 */

(function () {
    document.addEventListener('DOMContentLoaded', () => {

        // --- 1. Seletores ---
        console.log("Módulo de Relatórios (relatorios.js) inicializado.");
        
        const btnGerarPdf = document.getElementById('btn-gerar-pdf');
        const btnGerarCsv = document.getElementById('btn-gerar-csv');

        // --- 2. Função de Alerta ---
        function funcaoNaoImplementada(formato) {
            alert(`A função de gerar ${formato} ainda não foi implementada.\n\nIsto exigiria um serviço de backend dedicado para consultar o banco de dados e compilar o ficheiro.`);
        }

        // --- 3. "Ouvintes" de Eventos ---
        
        if (btnGerarPdf) {
            btnGerarPdf.addEventListener('click', () => {
                funcaoNaoImplementada('PDF');
            });
        }
        
        if (btnGerarCsv) {
            btnGerarCsv.addEventListener('click', () => {
                funcaoNaoImplementada('CSV');
            });
        }
    });
})();