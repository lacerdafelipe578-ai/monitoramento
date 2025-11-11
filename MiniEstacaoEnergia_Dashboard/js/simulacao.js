/**
 * js/simulacao.js
 *
 * Controlador da Aba "Simulação".
 *
 * Responsabilidades:
 * 1. Preencher o campo de Tarifa com o valor salvo nas Configurações.
 * 2. Ouvir o clique no botão "Calcular Projeção".
 * 3. Ler todos os inputs (Potência e Horas).
 * 4. Calcular o custo diário e mensal.
 * 5. Exibir o resultado.
 */

(function () {
    document.addEventListener('DOMContentLoaded', () => {

        // --- 1. Seletores ---
        console.log("Módulo de Simulação (simulacao.js) inicializado.");
        
        // Inputs
        const simTarifa = document.getElementById('sim-tarifa');
        const btnCalcular = document.getElementById('btn-calcular-simulacao');
        
        const simPotencia = [
            document.getElementById('sim-potencia-1'),
            document.getElementById('sim-potencia-2'),
            document.getElementById('sim-potencia-3'),
            document.getElementById('sim-potencia-4')
        ];
        
        const simHoras = [
            document.getElementById('sim-horas-1'),
            document.getElementById('sim-horas-2'),
            document.getElementById('sim-horas-3'),
            document.getElementById('sim-horas-4')
        ];
        
        // Outputs (Resultados)
        const simResultadoValor = document.getElementById('sim-resultado-valor');
        const simResultadoComparativo = document.getElementById('sim-resultado-comparativo');
        
        // --- 2. Funções ---

        /**
         * Carrega a tarifa salva no localStorage (pelo realtime.js)
         * e preenche o campo de tarifa nesta aba.
         */
        function carregarTarifaSalva() {
            const tarifaSalva = localStorage.getItem('tarifaKWh');
            if (tarifaSalva) {
                simTarifa.value = parseFloat(tarifaSalva).toFixed(2);
            }
        }
        
        /**
         * A função principal que calcula o custo.
         */
        function calcularProjecao() {
            // Pega a tarifa (do input ou 0.92 se vazio)
            const tarifa = parseFloat(simTarifa.value) || 0.92;
            let custoDiarioTotal = 0.0;
            
            for (let i = 0; i < 4; i++) {
                // Pega os valores (ou 0 se vazios)
                const potenciaW = parseFloat(simPotencia[i].value) || 0;
                const horasDia = parseFloat(simHoras[i].value) || 0;
                
                if (potenciaW > 0 && horasDia > 0) {
                    // 1. Converte Potência para kW
                    const potenciaKW = potenciaW / 1000.0;
                    
                    // 2. Calcula o custo diário daquela carga
                    // (kW * horas * tarifa)
                    const custoCargaDiario = potenciaKW * horasDia * tarifa;
                    
                    // 3. Soma ao total
                    custoDiarioTotal += custoCargaDiario;
                }
            }
            
            // 4. Calcula o custo mensal (x30 dias)
            const custoMensalTotal = custoDiarioTotal * 30;
            
            // 5. Exibe os resultados na tela
            simResultadoValor.textContent = `R$ ${custoMensalTotal.toFixed(2).replace('.', ',')}`;
            
            if (custoMensalTotal > 0) {
                simResultadoComparativo.textContent = `Projeção baseada em R$ ${custoDiarioTotal.toFixed(2).replace('.', ',')} por dia.`;
            } else {
                simResultadoComparativo.textContent = "Preencha os dados e calcule.";
            }
        }

        // --- 3. "Ouvintes" de Eventos ---
        
        // Ouve o clique no botão
        if (btnCalcular) {
            btnCalcular.addEventListener('click', calcularProjecao);
        }
        
        // Carrega a tarifa salva assim que o script roda
        carregarTarifaSalva();
    });
})();