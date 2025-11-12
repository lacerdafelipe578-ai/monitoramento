/**
 * js/realtime.js
 *
 * (v4 - Adiciona ?mode=guest para visitantes)
 */

(function () {

    // --- (NOVO) LÓGICA DE PERMISSÃO ---
    // Verifica se a URL contém "?mode=guest"
    const urlParams = new URLSearchParams(window.location.search);
    const IS_GUEST_MODE = urlParams.get('mode') === 'guest';

    if (IS_GUEST_MODE) {
        console.warn("Modo Visitante ATIVADO. Os controlos estão desativados.");
    }
    // ------------------------------------

    // --- 1. Configurações e Constantes ---
    
    // ATENÇÃO: COLE O OBJETO de configuração que você copiou do Firebase
    const firebaseConfig = {
      apiKey: "AIzaSy...", // COLE SEU CÓDIGO AQUI
      authDomain: "monitoramento-de-energia-acef9.firebaseapp.com", // COLE SEU CÓDIGO AQUI
      projectId: "monitoramento-de-energia-acef9", // COLE SEU CÓDIGO AQUI
      storageBucket: "monitoramento-de-energia-acef9.appspot.com", // COLE SEU CÓDIGO AQUI
      messagingSenderId: "273869054550", // COLE SEU CÓDIGO AQUI
      appId: "1:273869054550:web:f1a3a011d3a8a5e4df11f7", // COLE SEU CÓDIGO AQUI
      measurementId: "G-RV59GZMMG1" // COLE SEU CÓDIGO AQUI
    };

    // --- 2. Inicialização do Firebase ---
    
    let db;
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        console.log("Firebase (realtime.js) inicializado com sucesso!");
    } catch (e) {
        console.error("Erro ao inicializar o Firebase:", e);
        if (db) { 
             db = firebase.firestore();
        } else {
            updateConnectionStatus(false);
            return;
        }
    }

    // --- 3. Constantes do Sistema ---
    const LIMITE_STANDBY_W = 5;
    const LIMITE_SOBRECARGA_W_PADRAO = 1500;
    const TARIFA_PADRAO_KWH = 0.92;
    let tarifaKWh = TARIFA_PADRAO_KWH;
    let limiteSobrecargaW = LIMITE_SOBRECARGA_W_PADRAO;
    let nomesCargas = ["Carga 1", "Carga 2", "Carga 3", "Carga 4", "Carga 5"];

    // --- 4. Seletores de Elementos da UI ---
    // (Esta secção é idêntica à anterior)
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const potenciaTotalValor = document.getElementById('potencia-total-valor');
    const custoHoraValor = document.getElementById('custo-hora-valor');
    const custoDiaValor = document.getElementById('custo-dia-valor');
    const tensaoRedeValor = document.getElementById('tensao-rede-valor');
    const potenciaGraficoValor = document.getElementById('potencia-grafico-valor');
    const potenciaGraficoVariacao = document.getElementById('potencia-grafico-variacao');
    const configTarifaKwh = document.getElementById('config-tarifa-kwh');
    const configLimiteW = document.getElementById('config-limite-w');
    const btnSaveAllSettings = document.getElementById('btn-save-all-settings');
    const configNomeInputs = [
        document.getElementById('config-nome-1'),
        document.getElementById('config-nome-2'),
        document.getElementById('config-nome-3'),
        document.getElementById('config-nome-4')
    ];
    const simLivePotencia = [
        document.getElementById('sim-live-potencia-1'),
        document.getElementById('sim-live-potencia-2'),
        document.getElementById('sim-live-potencia-3'),
        document.getElementById('sim-live-potencia-4')
    ];

    // --- 5. Variáveis de Estado e Gráfico ---
    let powerChart = null;
    let ultimoValorPotencia = null;
    const MAX_CHART_POINTS = 60; 


    // --- 6. Funções Principais ---

    function conectarFirebase() {
        // ... (Esta função é idêntica à anterior)
        console.log("Conectando ao Firestore para dados ao vivo...");
        db.collection('status_atual').doc('live')
            .onSnapshot((doc) => {
                if (doc.exists) {
                    updateConnectionStatus(true);
                    const data = doc.data();
                    if (data.gerais) handleGeraisData(data.gerais);
                    if (data.reles) handleRelesData(data.reles);
                } else {
                    console.warn("Documento 'status_atual/live' não encontrado. Aguardando dados do Coletor...");
                    updateConnectionStatus(false);
                }
            }, (error) => {
                console.error("Erro ao ouvir dados do Firestore:", error);
                updateConnectionStatus(false);
            });
    }

    function handleGeraisData(data) {
        // ... (Esta função é idêntica à anterior)
        if (potenciaTotalValor) potenciaTotalValor.textContent = data.potencia_total.toFixed(0);
        if (tensaoRedeValor) tensaoRedeValor.textContent = data.tensao.toFixed(1);
        const potenciaEmKW = data.potencia_total / 1000.0;
        const custoPorHora = potenciaEmKW * tarifaKWh;
        const custoPorDia = custoPorHora * 24;
        if (custoHoraValor) custoHoraValor.textContent = custoPorHora.toFixed(2).replace('.', ',');
        if (custoDiaValor) custoDiaValor.textContent = custoPorDia.toFixed(2).replace('.', ',');
        const kpiPotenciaCard = potenciaTotalValor.closest('.bg-gray-800');
        if (data.potencia_total > limiteSobrecargaW) {
            kpiPotenciaCard.classList.add('bg-red-800', 'animate-pulse');
        } else {
            kpiPotenciaCard.classList.remove('bg-red-800', 'animate-pulse');
        }
        if (potenciaGraficoValor) potenciaGraficoValor.textContent = data.potencia_total.toFixed(0);
        updateVariacao(data.potencia_total);
        updateChart(data.potencia_total);
    }
    
    function handleRelesData(relesData) {
        if (!Array.isArray(relesData)) return;

        relesData.forEach(rele => {
            // ... (A lógica de status, consumo, etc., é idêntica) ...
            const releIndex = rele.rele - 1; 
            const statusBadge = document.getElementById(`status-rele-${rele.rele}`);
            const consumoValor = document.getElementById(`consumo-rele-${rele.rele}`);
            const toggle = document.getElementById(`toggle-rele-${rele.rele}`);
            const correnteValor = document.getElementById(`corrente-rele-${rele.rele}`);
            const card = statusBadge ? statusBadge.closest('.bg-gray-800') : null;
            const cardTitle = card ? card.querySelector('h3') : null; 
            if (cardTitle) {
                cardTitle.textContent = nomesCargas[releIndex] || `Carga ${rele.rele}`;
            }
            if (statusBadge && card) {
                if (rele.status === 'ON') {
                    if (rele.consumo > 0 && rele.consumo <= LIMITE_STANDBY_W) {
                        statusBadge.textContent = 'STANDBY';
                        statusBadge.className = 'mb-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-700/50 text-yellow-300';
                        card.style.borderColor = 'var(--brand-cyan-light)';
                    } else {
                        statusBadge.textContent = 'ON';
                        statusBadge.className = 'mb-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-700/50 text-green-300';
                        card.style.borderColor = 'var(--brand-lime)';
                    }
                } else {
                    statusBadge.textContent = 'OFF';
                    statusBadge.className = 'mb-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-700/50 text-red-300';
                    card.style.borderColor = 'transparent';
                }
            }
            if (consumoValor) consumoValor.textContent = rele.consumo.toFixed(0);
            if (correnteValor) correnteValor.textContent = rele.corrente.toFixed(2).replace('.', ',');
            if (releIndex < simLivePotencia.length && simLivePotencia[releIndex]) {
                simLivePotencia[releIndex].textContent = rele.consumo.toFixed(0);
            }

            // --- (NOVA) LÓGICA DE PERMISSÃO ---
            if (toggle) {
                toggle.removeEventListener('change', handleToggleChange);
                toggle.checked = (rele.status === 'ON');
                
                if (IS_GUEST_MODE) {
                    // Modo Visitante: Apenas desative o botão
                    toggle.disabled = true;
                } else {
                    // Modo Admin: Reative o botão e adicione o listener
                    toggle.disabled = false; 
                    toggle.addEventListener('change', handleToggleChange);
                }
            }
            // --- FIM DA LÓGICA DE PERMISSÃO ---
        });
    }

    function handleToggleChange(event) {
        // (Esta função é idêntica à v3, com o setTimeout)
        const releIndex = event.target.dataset.releIndex;
        const newState = event.target.checked ? 'ON' : 'OFF';
        const toggleElement = event.target;
        
        toggleElement.disabled = true; 

        console.log(`Enviando comando para Relé ${releIndex}: ${newState}`);
        
        db.collection('comandos').add({
            rele: releIndex,
            comando: newState,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            setTimeout(() => {
                toggleElement.disabled = false;
            }, 2000); 
        })
        .catch((error) => {
            console.error("Erro ao enviar comando: ", error);
            toggleElement.checked = !toggleElement.checked;
            toggleElement.disabled = false;
        });
    }
    
    function carregarConfiguracoes() {
        // ... (Esta função é idêntica à anterior)
        const tarifaSalva = localStorage.getItem('tarifaKWh');
        const limiteSalvo = localStorage.getItem('limiteSobrecargaW');
        const nomesSalvos = localStorage.getItem('nomesCargas');
        if (tarifaSalva) tarifaKWh = parseFloat(tarifaSalva);
        if (limiteSalvo) limiteSobrecargaW = parseFloat(limiteSalvo);
        if (nomesSalvos) {
            nomesCargas = JSON.parse(nomesSalvos);
        }
        if(configTarifaKwh) configTarifaKwh.value = tarifaKWh;
        if(configLimiteW) configLimiteW.value = limiteSobrecargaW;
        if(configNomeInputs[0]) {
            configNomeInputs.forEach((input, index) => {
                if(input) input.value = nomesCargas[index] || '';
            });
        }
    }

    function salvarConfiguracoes() {
        // ... (Esta função é idêntica à anterior)
        console.log("Salvando configurações...");
        tarifaKWh = parseFloat(configTarifaKwh.value) || TARIFA_PADRAO_KWH;
        limiteSobrecargaW = parseFloat(configLimiteW.value) || LIMITE_SOBRECARGA_W_PADRAO;
        localStorage.setItem('tarifaKWh', tarifaKWh);
        localStorage.setItem('limiteSobrecargaW', limiteSobrecargaW);
        nomesCargas = configNomeInputs.map(input => input.value || '');
        localStorage.setItem('nomesCargas', JSON.stringify(nomesCargas));
        alert("Configurações salvas com sucesso!");
        db.collection('status_atual').doc('live').get().then(doc => {
            if (doc.exists && doc.data().reles) {
                handleRelesData(doc.data().reles);
            }
        });
        document.querySelector('.nav-link[data-page="page-realtime"]').click();
    }

    // --- 7. Funções Auxiliares (Gráfico, Toggles, etc.) ---
    
    function updateConnectionStatus(isConnected) {
        // ... (idêntica)
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
    
    function inicializarChart() {
        // ... (idêntica)
        const ctx = document.getElementById('power-chart');
        if (!ctx) return; 
        powerChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Potência (W)',
                    data: [],
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
                    y: { beginAtZero: true, ticks: { color: '#9CA3AF' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                    x: { ticks: { color: '#9CA3AF' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    function updateChart(valor) {
        // ... (idêntica)
        if (!powerChart) return;
        const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        powerChart.data.labels.push(timestamp);
        powerChart.data.datasets[0].data.push(valor);
        if (powerChart.data.labels.length > MAX_CHART_POINTS) {
            powerChart.data.labels.shift();
            powerChart.data.datasets[0].data.shift();
        }
        powerChart.update('none');
    }

    function updateVariacao(novoValor) {
        // ... (idêntica)
        if (!potenciaGraficoVariacao) return; 
        if (ultimoValorPotencia === null || novoValor === ultimoValorPotencia || ultimoValorPotencia === 0) {
            if (ultimoValorPotencia === null) {
                potenciaGraficoVariacao.innerHTML = `<span class="material-symbols-outlined text-sm mr-1">horizontal_rule</span><span class="text-sm font-medium">--%</span>`;
                potenciaGraficoVariacao.className = 'flex items-center px-3 py-1.5 rounded-full bg-gray-700 text-gray-300';
            }
            ultimoValorPotencia = novoValor;
            return;
        }
        const variacao = ((novoValor - ultimoValorPotencia) / ultimoValorPotencia) * 100;
        let icone, corFundo, corTexto, texto;
        texto = `${Math.abs(variacao).toFixed(0)}%`;
        if (variacao > 0) {
            icone = 'arrow_upward';
            corFundo = 'bg-green-700/50';
            corTexto = 'text-green-300';
        } else {
            icone = 'arrow_downward';
            corFundo = 'bg-red-700/50';
            corTexto = 'text-red-300';
        }
        potenciaGraficoVariacao.innerHTML = `<span class="material-symbols-outlined text-sm mr-1">${icone}</span><span class="text-sm font-medium">${texto}</span>`;
        potenciaGraficoVariacao.className = `flex items-center px-3 py-1.5 rounded-full ${corFundo} ${corTexto}`;
        ultimoValorPotencia = novoValor;
    }
    
    function inicializarToggles() {
        const toggles = document.querySelectorAll('#page-realtime .toggle');
        toggles.forEach(toggle => {
            // --- (NOVA) LÓGICA DE PERMISSÃO ---
            if (IS_GUEST_MODE) {
                // Se for visitante, apenas desativa o botão
                toggle.disabled = true;
            } else {
                // Se for admin, adiciona o listener
                toggle.addEventListener('change', handleToggleChange);
            }
        });
    }

    // --- 8. Inicialização do Script ---
    carregarConfiguracoes(); 
    conectarFirebase();
    inicializarChart();
    inicializarToggles();
    
    if(btnSaveAllSettings) {
        btnSaveAllSettings.addEventListener('click', salvarConfiguracoes);
    }

})();
