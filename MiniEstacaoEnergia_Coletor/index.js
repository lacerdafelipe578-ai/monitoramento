console.log("Iniciando o Coletor de Energia IoT...");

// --- 1. Importar as Bibliotecas ---
const mqtt = require('mqtt'); // Para ouvir o broker MQTT
const admin = require('firebase-admin'); // Para escrever no Firebase Admin

// --- 2. Configurações ---

// Chave do Firebase (o arquivo .json que você baixou e renomeou)
const serviceAccount = require('./firebase-key.json');

// ID ÚNICO do seu projeto (o mesmo do ESP32 e do Dashboard)
const ID_UNICO = 'aluno123'; 

// Tópicos MQTT que vamos ouvir
const MQTT_BROKER = 'mqtt://broker.hivemq.com:1883';
const TOPIC_DADOS_GERAIS = `fucapi/${ID_UNICO}/estacao/dados/gerais`;
const TOPIC_DADOS_RELES = `fucapi/${ID_UNICO}/estacao/dados/reles`;
const TOPIC_COMANDO_BASE = `fucapi/${ID_UNICO}/estacao/comando/rele`;

// --- 3. Inicializar o Firebase Admin ---
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    const db = admin.firestore(); // Nosso banco de dados Firestore
    console.log('Firebase Admin conectado com sucesso!');
} catch (e) {
    console.error('ERRO CRÍTICO: Falha ao conectar no Firebase. Verifique o arquivo firebase-key.json');
    console.error(e);
    process.exit(1); // Encerra o script se não conseguir conectar
}

// --- 4. Inicializar o Cliente MQTT ---
const mqttClient = mqtt.connect(MQTT_BROKER);

// Variáveis globais para guardar os dados mais recentes
let dadosGeraisAtuais = {};
let dadosRelesAtuais = [];

/**
 * Função principal que salva os dados no Firebase.
 * Ela junta os dados gerais e dos relés em um único documento
 * para otimizar as leituras do dashboard.
 */
async function atualizarStatusAoVivo() {
    if (!dadosGeraisAtuais || !dadosRelesAtuais) {
        // Se ainda não recebemos os dois, não faz nada
        return; 
    }

    try {
        const db = admin.firestore();
        const docRef = db.collection('status_atual').doc('live');

        const payload = {
            gerais: dadosGeraisAtuais,
            reles: dadosRelesAtuais,
            // Adiciona um timestamp de quando o servidor salvou
            ultimoUpdate: admin.firestore.FieldValue.serverTimestamp() 
        };

        // Atualiza o documento 'live' com os novos dados
        await docRef.set(payload);
        
        // Também salva uma cópia na coleção 'leituras' para o histórico
        // (Isso é o que alimenta a Aba "Histórico")
        await db.collection('leituras').add(payload);

        console.log(`[Firebase] Dados ao vivo atualizados com Potência Total: ${dadosGeraisAtuais.potencia_total}W`);
        
    } catch (e) {
        console.error('[Firebase] Erro ao salvar dados:', e.message);
    }
}


// --- 5. Lógica de Conexão MQTT ---

// Quando o MQTT conectar...
mqttClient.on('connect', () => {
    console.log(`[MQTT] Conectado ao broker: ${MQTT_BROKER}`);
    
    // ...se inscreva nos tópicos de dados do ESP32
    mqttClient.subscribe(TOPIC_DADOS_GERAIS, (err) => {
        if (!err) console.log(`[MQTT] Inscrito em: ${TOPIC_DADOS_GERAIS}`);
    });
    mqttClient.subscribe(TOPIC_DADOS_RELES, (err) => {
        if (!err) console.log(`[MQTT] Inscrito em: ${TOPIC_DADOS_RELES}`);
    });
});

// Quando uma mensagem do ESP32 chegar...
mqttClient.on('message', (topic, payload) => {
    try {
        const message = payload.toString();
        const data = JSON.parse(message);

        if (topic === TOPIC_DADOS_GERAIS) {
            //console.log(`[MQTT] Recebido GERAIS: ${message}`);
            dadosGeraisAtuais = data;
            // Só atualiza o Firebase quando os dados dos relés chegarem
        } 
        else if (topic === TOPIC_DADOS_RELES) {
            //console.log(`[MQTT] Recebido RELES: ${message}`);
            dadosRelesAtuais = data;
            
            // Esta é a nossa sincronia:
            // Quando os dados dos relés chegam, atualizamos o Firebase
            // com os dados gerais E os dados dos relés juntos.
            atualizarStatusAoVivo();
        }

    } catch (e) {
        console.error(`[MQTT] Erro ao processar mensagem do tópico ${topic}: ${e.message}`);
    }
});

mqttClient.on('error', (err) => {
    console.error('[MQTT] Erro de conexão:', err);
});

// --- 6. Lógica de Comandos (Firebase -> MQTT) ---
// Ouve a coleção 'comandos' no Firebase

const db = admin.firestore();
db.collection('comandos').onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
        // Se um NOVO comando foi adicionado...
        if (change.type === 'added') {
            const comandoData = change.doc.data();
            
            const rele = comandoData.rele; // Ex: "1"
            const cmd = comandoData.comando; // Ex: "ON"
            const topic = `${TOPIC_COMANDO_BASE}/${rele}`;

            console.log(`[Comando] Recebido do Dashboard: Relé ${rele} -> ${cmd}`);
            
            // Publica o comando no MQTT para o ESP32 ouvir
            mqttClient.publish(topic, cmd, (err) => {
                if(err) console.error('[Comando] Erro ao enviar comando para o MQTT:', err);
                else console.log(`[Comando] Enviado para o ESP32 via MQTT.`);
            });

            // (Opcional) Deleta o comando para não ser processado de novo
            change.doc.ref.delete();
        }
    });
}, (err) => {
    console.error("[Firebase] Erro ao ouvir coleção 'comandos':", err);
});


