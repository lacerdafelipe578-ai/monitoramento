/**
 * Script para o Dashboard de Energia IoT
 *
 * Conecta-se ao broker MQTT via WebSocket e atualiza a UI.
 * Gerencia os dados recebidos e os comandos enviados.
 */

// Espera o DOM carregar completamente antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Configurações e Constantes ---
    
    // ATENÇÃO: Use o mesmo ID único do seu firmware ESP32
    const ID_UNICO = 'aluno123'; 
    
    const MQTT_BROKER = 'wss://broker.hivemq.com:8884/mqtt';
    const MQTT_CLIENT_ID = `dashboard_client_${Math.random().toString(16).substring(2, 8)}`;

    // Tópicos (Devem ser iguais aos do ESP32)
    const TOPIC_DADOS_GERAIS = `fucapi/${ID_UNICO}/estacao/dados/gerais`;
    const TOPIC_DADOS_RELES = `fucapi/${ID_UNICO}/estacao/dados/reles`;
    const TOPIC_COMANDO_BASE = `fucapi/${ID_UNICO}/estacao/comando/rele`;

    // --- 2. Seletores de Elementos da UI ---
    
    // Status da Conexão
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');

    // KPIs Globais
    const potenciaTotalValor = document.getElementById('potencia-total-valor');
    const custoMesValor = document.getElementById('custo-mes-valor'); // <-- VAMOS USAR ESTE
    const tensaoRedeValor = document.getElementById('tensao-rede-valor');
    const temperaturaAmbienteValor = document.getElementById('temperatura-ambiente-valor');

    // Gráfico
    const potenciaGraficoValor = document.getElementById('potencia-grafico-valor');
    const potenciaGraficoVariacao = document.getElementById('potencia-grafico-variacao');
    
    // --- 3. Variáveis de Estado e Gráfico ---
    
    let mqttClient = null;
    let powerChart = null;
    let ultimoValorPotencia = null;
    const MAX_CHART_POINTS = 30; // Número de pontos a exibir no gráfico

    // --- 4. Funções Principais ---

    /**
     * Inicializa a conexão com o Broker MQTT.
     */
    function conectarMQTT() {
        console.log(`Conectando ao broker MQTT: ${MQTT_BROKER}`);
        
        // Tenta conectar
        mqttClient = mqtt.connect(MQTT_BROKER, {
            clientId: MQTT_CLIENT_ID,
            connectTimeout: 5000, // 5 segundos
            reconnectPeriod: 2000, // Tenta reconectar a cada 2 segundos
        });

        // --- Handlers de Eventos MQTT ---

        // Evento: Conectado
        mqttClient.on('connect', () => {
            console.log('Conectado ao broker MQTT com sucesso!');
            updateConnectionStatus(true);
            
            // Subscreve nos tópicos de dados
            mqttClient.subscribe(TOPIC_DADOS_GERAIS, (err) => {
                if (!err) {
                    console.log(`Inscrito em: ${TOPIC_DADOS_GERAIS}`);
                }
            });
            mqttClient.subscribe(TOPIC_DADOS_RELES, (err) => {
                if (!err) {
                    console.log(`Inscrito em: ${TOPIC_DADOS_RELES}`);
                }
            });
        });

        // Evento: Mensagem Recebida
        mqttClient.on('message', (topic, payload) => {
            const message = payload.toString();
            // console.log(`Mensagem recebida em [${topic}]: ${message}`);
            
            try {
                const data = JSON.parse(message);
                
                if (topic === TOPIC_DADOS_GERAIS) {
                    handleGeraisData(data);
                } else if (topic === TOPIC_DADOS_RELES) {
                    handleRelesData(data);
                }

            } catch (error) {
                console.error(`Falha ao processar JSON da mensagem: ${error.message}`, message);
            }
        });

        // Evento: Erro ou Desconexão
        mqttClient.on('error', (err) => {
            console.error('Erro no MQTT:', err);
            updateConnectionStatus(false);
        });

        mqttClient.on('reconnect', () => {
            console.log('Tentando reconectar ao MQTT...');
            updateConnectionStatus(false);
        });

        mqttClient.on('close', () => {
            console.log('Conexão MQTT fechada.');
            updateConnectionStatus(false);
        });
    }

    /**
     * Atualiza os indicadores visuais de status da conexão (RF-09).
     * @param {boolean} isConnected - true se conectado, false se desconectado.
     */
    function updateConnectionStatus(isConnected) {
        if (isConnected) {
            statusIndicator.classList.remove('bg-red-500');
            statusIndicator.classList.add('bg-green-500', 'connection-pulse');
            statusText.textContent = 'Conectado';
            statusText.classList.remove('text-red-400');
            statusText.classList.add('text-green-400');
        } else {
            statusIndicator.classList.remove('bg-green-500', 'connection-pulse');
            statusIndicator.classList.add('bg-red-500');
            statusText.textContent = 'Desconectado';
            statusText.classList.remove('text-green-400');
            statusText.classList.add('text-red-400');
        }
    }

    /**
     * Processa dados do tópico 'fucapi/estacao/dados/gerais'.
     * @param {object} data - O objeto JSON recebido.
     */
    function handleGeraisData(data) {
        // Atualiza KPIs Globais (RF-01, RF-02, RF-04)
        if (potenciaTotalValor) potenciaTotalValor.textContent = data.potencia_total.toFixed(0);
        if (tensaoRedeValor) tensaoRedeValor.textContent = data.tensao.toFixed(1);
        if (temperaturaAmbienteValor) temperaturaAmbienteValor.textContent = data.temperatura.toFixed(1);
        
        // --- MUDANÇA AQUI ---
        // Atualiza o Custo Acumulado (RF-03)
        // O ESP32 agora envia "custo_acumulado"
        if (custoMesValor && data.hasOwnProperty('custo_acumulado')) {
            // Formata para R$ 1,23
            custoMesValor.textContent = data.custo_acumulado.toFixed(2).replace('.', ',');
        }
        
        // Atualiza o KPI do Gráfico
        if (potenciaGraficoValor) potenciaGraficoValor.textContent = data.potencia_total.toFixed(0);

        // Atualiza a Variação Percentual
        updateVariacao(data.potencia_total);
        
        // Atualiza o Gráfico (RF-05)
        updateChart(data.potencia_total);
    }
    
    /**
     * Processa dados do tópico 'fucapi/estacao/dados/reles'.
     * @param {Array<object>} relesData - O array de objetos de relés.
     */
    function handleRelesData(relesData) {
        if (!Array.isArray(relesData)) {
            console.error('Dados de relés não é um array:', relesData);
            return;
        }

        relesData.forEach(rele => {
            const statusBadge = document.getElementById(`status-rele-${rele.rele}`);
            const consumoValor = document.getElementById(`consumo-rele-${rele.rele}`);
            const toggle = document.getElementById(`toggle-rele-${rele.rele}`);
            const correnteValor = document.getElementById(`corrente-rele-${rele.rele}`);

            // Atualiza o Status (RF-07)
            if (statusBadge) {
                if (rele.status === 'ON') {
                    statusBadge.textContent = 'ON';
                    statusBadge.classList.remove('bg-gray-700', 'text-gray-300', 'bg-red-700/50', 'text-red-300');
                    statusBadge.classList.add('bg-green-700/50', 'text-green-300');
                } else {
                    statusBadge.textContent = 'OFF';
                    statusBadge.classList.remove('bg-gray-700', 'text-gray-300', 'bg-green-700/50', 'text-green-300');
                    statusBadge.classList.add('bg-red-700/50', 'text-red-300');
                }
            }

            // Atualiza o Consumo (Potência) (RF-08)
            if (consumoValor) {
                consumoValor.textContent = rele.consumo.toFixed(0);
            }
            
            // Atualiza a Corrente (Amperes)
            if (correnteValor) {
                if (rele.hasOwnProperty('corrente')) {
                    // Formata para 2 casas decimais (ex: 0,75 A)
                    correnteValor.textContent = rele.corrente.toFixed(2).replace('.', ',');
                } else {
                    correnteValor.textContent = '--'; // Caso o dado não venha
                }
            }

            // Sincroniza o Toggle (Interruptor)
            if (toggle) {
                // Remove o listener temporariamente para evitar loop de evento
                toggle.removeEventListener('change', handleToggleChange);
                toggle.checked = (rele.status === 'ON');
                toggle.addEventListener('change', handleToggleChange);
            }
        });
    }

    /**
     * Handler para o clique no interruptor (RF-06).
     * @param {Event} event - O evento de 'change' do input checkbox.
     */
    function handleToggleChange(event) {
        if (!mqttClient || !mqttClient.connected) {
            console.error('Não conectado ao MQTT. Impossível enviar comando.');
            // Reverte o clique
            event.target.checked = !event.target.checked;
            return;
        }

        const releIndex = event.target.dataset.releIndex;
        const newState = event.target.checked ? 'ON' : 'OFF';
        const topic = `${TOPIC_COMANDO_BASE}/${releIndex}`;

        console.log(`Publicando no tópico [${topic}]: ${newState}`);
        
        // Publica o comando
        mqttClient.publish(topic, newState, { qos: 1 });
    }
    
    /**
     * Inicializa o gráfico do Chart.js.
     */
    function inicializarChart() {
        const ctx = document.getElementById('power-chart');
        if (!ctx) {
            console.error('Elemento Canvas #power-chart não encontrado.');
            return;
        }

        powerChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Potência (W)',
                    data: [],
                    borderColor: 'rgba(52, 211, 153, 1)', // Verde
                    backgroundColor: 'rgba(52, 211, 153, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.3, // Curva suave
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#9CA3AF' }, // Cinza
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

    /**
     * Adiciona um novo dado ao gráfico (RF-05).
     * @param {number} valor - O novo valor de potência.
     */
    function updateChart(valor) {
        if (!powerChart) return;

        const timestamp = new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // Adiciona novos dados
        powerChart.data.labels.push(timestamp);
        powerChart.data.datasets[0].data.push(valor);

        // Limita o número de pontos no gráfico
        if (powerChart.data.labels.length > MAX_CHART_POINTS) {
            powerChart.data.labels.shift();
            powerChart.data.datasets[0].data.shift();
        }

        // Atualiza o gráfico sem animação (melhor performance para tempo real)
        powerChart.update('none');
    }

    /**
     * Atualiza o indicador de variação percentual.
     * @param {number} novoValor - O valor atual da potência.
     */
    function updateVariacao(novoValor) {
        if (ultimoValorPotencia === null || novoValor === ultimoValorPotencia || ultimoValorPotencia === 0) {
            // Se for o primeiro dado, ou igual ao anterior, ou o anterior for 0
            if (ultimoValorPotencia === null) {
                potenciaGraficoVariacao.innerHTML = `
                    <span class="material-symbols-outlined text-sm mr-1">horizontal_rule</span>
                    <span class="text-sm font-medium">--% vs. anterior</span>`;
                potenciaGraficoVariacao.className = 'flex items-center px-3 py-1.5 rounded-full bg-gray-700 text-gray-300';
            }
            ultimoValorPotencia = novoValor;
            return;
        }

        const variacao = ((novoValor - ultimoValorPotencia) / ultimoValorPotencia) * 100;
        
        let icone, corFundo, corTexto, texto;
        texto = `${Math.abs(variacao).toFixed(1)}% vs. anterior`;

        if (variacao > 0) {
            icone = 'arrow_upward';
            corFundo = 'bg-green-700/50';
            corTexto = 'text-green-300';
        } else {
            icone = 'arrow_downward';
            corFundo = 'bg-red-700/50';
            corTexto = 'text-red-300';
        }

        potenciaGraficoVariacao.innerHTML = `
            <span class="material-symbols-outlined text-sm mr-1">${icone}</span>
            <span class="text-sm font-medium">${texto}</span>`;
        
        potenciaGraficoVariacao.className = `flex items-center px-3 py-1.5 rounded-full ${corFundo} ${corTexto}`;

        ultimoValorPotencia = novoValor;
    }

    /**
     * Adiciona os listeners de evento aos interruptores.
     */
    function inicializarToggles() {
        const toggles = document.querySelectorAll('.toggle');
        toggles.forEach(toggle => {
            // Adiciona o listener
            toggle.addEventListener('change', handleToggleChange);
            
            // Desabilita visualmente o toggle da Carga 5 (sem sensor)
            if (toggle.dataset.releIndex === '5') {
                // Apenas um efeito visual, ele ainda é funcional
                const card = toggle.closest('.bg-gray-800');
                if (card) {
                    card.classList.add('opacity-70');
                }
            }
        });
    }

    // --- 5. Inicialização ---
    
    conectarMQTT();
    inicializarChart();
    inicializarToggles();

});