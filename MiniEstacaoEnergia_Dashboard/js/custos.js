/**
 * js/custos.js
 *
 * Controlador da Aba "Custos e Economia".
 *
 * Responsabilidades:
 * 1. Ouvir o clique na aba "Custos".
 * 2. Buscar dados do localStorage (Tarifa, Nomes das Cargas).
 * 3. *SIMULAR* cálculos de custo mensal e rankings (pois consultas reais de 30 dias são inviáveis no frontend).
 * 4. Preencher os KPIs e o ranking da aba.
 */

(function () {
    document.addEventListener('DOMContentLoaded', () => {

        // --- 1. Seletores ---
        console.log("Módulo de Custos (custos.js) inicializado.");
        
        // Link da Nav
        const navLink = document.querySelector('.nav-link[data-page="page-custos"]');

        // Elementos da Aba
        const custoMesValor = document.getElementById('custos-mes-valor');
        const metaTitulo = document.getElementById('custos-meta-titulo');
        const metaBarra = document.getElementById('custos-meta-barra');
        const metaTexto = document.getElementById('custos-meta-texto');
        const comparativoValor = document.getElementById('custos-comparativo-valor');
        const comparativoTexto = document.getElementById('custos-comparativo-texto');
        const rankingLista = document.getElementById('custos-ranking-lista');

        // --- 2. Função Principal (Simulada) ---

        /**
         * Carrega e exibe os dados (simulados) de custo.
         * Numa versão real, isso faria consultas complexas ao Firebase.
         */
        function carregarDadosDeCustos() {
            console.log("Aba Custos clicada. Carregando dados simulados...");

            // Pega dados reais das Configurações (salvos no localStorage)
            const tarifa = parseFloat(localStorage.getItem('tarifaKWh')) || 0.92;
            const nomesCargas = JSON.parse(localStorage.getItem('nomesCargas')) || ["Carga 1", "Carga 2", "Carga 3", "Carga 4"];
            
            // --- DADOS SIMULADOS (Exemplo) ---
            // Numa app real, estes dados viriam de uma consulta complexa ao Firebase.
            const custoMensalAtual = 112.50;
            const custoMensalPassado = 104.20;
            const metaMensal = 150.00;
            const rankingConsumo = [ // (em kWh)
                { id: 1, nome: nomesCargas[1] || "Carga 2", consumo: 42.5 },
                { id: 0, nome: nomesCargas[0] || "Carga 1", consumo: 30.1 },
                { id: 2, nome: nomesCargas[2] || "Carga 3", consumo: 18.0 },
                { id: 3, nome: nomesCargas[3] || "Carga 4", consumo: 5.2 },
            ];
            // --- Fim dos Dados Simulados ---

            
            // 1. Preenche o KPI "Custo Acumulado"
            if (custoMesValor) {
                custoMesValor.textContent = `R$ ${custoMensalAtual.toFixed(2).replace('.', ',')}`;
            }

            // 2. Preenche o KPI "Meta Mensal"
            if (metaTitulo && metaBarra && metaTexto) {
                const percMeta = (custoMensalAtual / metaMensal) * 100;
                
                metaTitulo.textContent = `Meta Mensal (R$ ${metaMensal.toFixed(2).replace('.', ',')})`;
                metaBarra.style.width = `${percMeta.toFixed(0)}%`;
                metaTexto.textContent = `${percMeta.toFixed(0)}% da meta atingida`;

                // Muda a cor da barra se estourar a meta
                if (percMeta > 100) {
                    metaBarra.classList.remove('bg-green-500');
                    metaBarra.classList.add('bg-red-500');
                } else {
                    metaBarra.classList.add('bg-green-500');
                    metaBarra.classList.remove('bg-red-500');
                }
            }

            // 3. Preenche o KPI "Comparativo"
            if (comparativoValor && comparativoTexto) {
                const diferenca = custoMensalAtual - custoMensalPassado;
                const percDiferenca = (diferenca / custoMensalPassado) * 100;
                
                if (percDiferenca > 0) {
                    comparativoValor.textContent = `+${percDiferenca.toFixed(0)}%`;
                    comparativoValor.className = "text-4xl font-bold text-red-400"; // Vermelho (ruim)
                    comparativoTexto.textContent = `R$ ${diferenca.toFixed(2).replace('.', ',')} a mais que o mês anterior.`;
                } else {
                    comparativoValor.textContent = `${percDiferenca.toFixed(0)}%`;
                    comparativoValor.className = "text-4xl font-bold text-green-400"; // Verde (bom)
                    comparativoTexto.textContent = `R$ ${Math.abs(diferenca).toFixed(2).replace('.', ',')} a menos.`;
                }
            }
            
            // 4. Preenche o "Ranking de Consumo"
            if (rankingLista) {
                // Limpa a lista (remove o "Calculando...")
                rankingLista.innerHTML = ""; 
                
                rankingConsumo.forEach(item => {
                    const li = document.createElement('li');
                    li.className = "text-gray-300";
                    li.textContent = `${item.nome} - ${item.consumo.toFixed(1)} kWh`;
                    rankingLista.appendChild(li);
                });
            }
        }

        // --- 3. "Ouvinte" de Eventos ---
        
        // Ouve o clique no link da aba "Custos"
        if (navLink) {
            navLink.addEventListener('click', () => {
                // Roda a função de carregar dados APENAS quando o usuário
                // clicar nesta aba (para economizar recursos).
                carregarDadosDeCustos();
            });
        }
    });
})();