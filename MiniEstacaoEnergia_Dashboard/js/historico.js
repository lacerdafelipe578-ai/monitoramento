/**
 * js/historico.js
 *
 * Controlador da Aba "Histórico".
 *
 * Responsabilidades:
 * 1. Inicializar o gráfico da aba de histórico.
 * 2. Ouvir cliques nos botões de filtro (24h, 7d, 30d).
 * 3. Buscar (Query) os dados no Firestore na coleção 'leituras'.
 * 4. Processar os dados e exibi-los no gráfico.
 * 5. Popular o "Ranking de Consumo".
 */

(function () {
    // Espera o DOM carregar (assim como o main.js e realtime.js)
    document.addEventListener('DOMContentLoaded', () => {

        // --- 1. Inicialização e Seletores ---
        console.log("Módulo de Histórico (historico.js) inicializado.");

        // Pega o DB do Firebase (inicializado no realtime.js)
        // Esta é uma forma simples de pegar a instância, já que o SDK já foi carregado
        const db = firebase.firestore();

        const filterButtons = document.querySelectorAll('#page-historico .btn-filter-time');
        const rankingList = document.querySelector('#page-historico .ranking-list'); // (Vamos adicionar esta classe no HTML)
        const historyChartCanvas = document.getElementById('history-chart-canvas'); // (Vamos adicionar este ID no HTML)
        
        let historyChart = null; // Variável para guardar nosso gráfico

        // --- 2. Inicialização do Gráfico Vazio ---
        
        // (Primeiro, precisamos de um <canvas> no HTML)
        // (Vamos assumir que o <canvas> em #page-historico tem o ID 'history-chart-canvas')

        /*
        // --- FUNÇÕES PRINCIPAIS ---
        */

        /**
         * Busca dados no Firestore com base no período
         * @param {string} period - "24h", "7d", ou "30d"
         */
        async function loadHistoryData(period) {
            console.log(`Carregando dados para o período: ${period}`);
            
            // (Lógica de data seria aqui, mas vamos usar o limite por enquanto)
            
            // --- ATENÇÃO ---
            // Como seu "Coletor" salva 1 dado/segundo, uma query de 24h traria 86.400
            // documentos, o que travaria o navegador.
            //
            // Por enquanto, vamos buscar apenas os últimos 500 dados
            // como prova de conceito.
            
            try {
                const querySnapshot = await db.collection('leituras')
                                              .orderBy('ultimoUpdate', 'desc') // Pega os mais recentes
                                              .limit(500) // Limita a 500 documentos
                                              .get();
                
                console.log(`Encontrados ${querySnapshot.size} documentos de histórico.`);

                // Processa os dados para o gráfico
                const labels = [];
                const dataPoints = [];
                
                // Os dados vêm 'desc' (mais novo primeiro), precisamos inverter
                const docs = querySnapshot.docs.reverse();

                docs.forEach(doc => {
                    const data = doc.data();
                    
                    // Formata o timestamp para o gráfico
                    const timestamp = data.ultimoUpdate.toDate();
                    const label = `${timestamp.getHours()}:${timestamp.getMinutes().toString().padStart(2, '0')}`;
                    
                    labels.push(label);
                    dataPoints.push(data.gerais.potencia_total);
                });

                // Atualiza o gráfico
                updateHistoryChart(labels, dataPoints);

            } catch (error) {
                console.error("Erro ao buscar dados do histórico:", error);
            }
        }

        /**
         * Desenha ou atualiza o gráfico de histórico
         */
        function updateHistoryChart(labels, dataPoints) {
            if (!historyChartCanvas) {
                console.error("Canvas do gráfico de histórico não encontrado!");
                return;
            }

            // Se o gráfico já existe, atualiza
            if (historyChart) {
                historyChart.data.labels = labels;
                historyChart.data.datasets[0].data = dataPoints;
                historyChart.update();
            } else {
                // Se não existe, cria
                historyChart = new Chart(historyChartCanvas, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Potência (W)',
                            data: dataPoints,
                            borderColor: 'var(--brand-cyan-light)',
                            backgroundColor: 'rgba(0, 180, 216, 0.1)',
                            borderWidth: 2,
                            pointRadius: 0,
                            tension: 0.3,
                            fill: true,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { color: '#9CA3AF' },
                                grid: { color: 'rgba(255, 255, 255, 0.05)' }
                            },
                            x: {
                                ticks: { color: '#9CA3AF' },
                                grid: { color: 'rgba(255, 255, 255, 0.05)' }
                            }
                        },
                        plugins: {
                            legend: { display: false }
                        }
                    }
                });
            }
        }


        // --- 3. Adicionar "Ouvintes" de Evento ---
        
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove o 'active' de todos
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // Adiciona 'active' no clicado
                button.classList.add('active');
                
                const period = button.getAttribute('data-period'); // Ex: "24h"
                loadHistoryData(period);
            });
        });

        // (Opcional) Carregar dados de 24h automaticamente quando a aba for mostrada
        // (Isso é mais avançado, por enquanto faremos por clique)
        
        // Clicar no botão de 24h por padrão
        // document.querySelector('#page-historico .btn-filter-time[data-period="24h"]').click();

    });
})();