const { Client, GatewayIntentBits } = require('discord.js');
const { Shoukaku, Connectors } = require('shoukaku');
const db = require('../database.js');
const { decrypt } = require('./encryption.js');
const Nodes = require('../config/lavalink.js');

class MusicOrchestrator {
    constructor() {
        this.workers = new Map(); // Armazena { client, shoukaku, id }
    }

    async start() {
        console.log('[Orchestrator] 🎻 Iniciando orquestra de bots de música...');
        
        // 1. Buscar bots no banco
        const result = await db.query('SELECT * FROM music_workers WHERE is_active = true');
        const workersData = result.rows;

        if (workersData.length === 0) {
            console.log('[Orchestrator] ⚠️ Nenhum bot de música configurado no banco.');
            return;
        }

        // 2. Inicializar cada bot (Worker)
        for (const data of workersData) {
            try {
                const token = decrypt({ content: data.token_enc, iv: data.iv });
                if (!token) {
                    console.error(`[Orchestrator] ❌ Falha ao decriptar token do worker ${data.name}`);
                    continue;
                }

                // Cria o Cliente do Bot Burro
                const workerClient = new Client({
                    intents: [
                        GatewayIntentBits.Guilds,
                        GatewayIntentBits.GuildVoiceStates // Necessário para tocar música
                    ]
                });

                // Cria a instância do Shoukaku vinculada a ESTE worker
                const shoukaku = new Shoukaku(new Connectors.DiscordJS(workerClient), Nodes, {
                    moveOnDisconnect: false,
                    resume: false,
                    reconnectTries: 5,
                    restTimeout: 10000
                });

                shoukaku.on('error', (_, error) => console.error(`[Worker ${data.name}] ❌ Erro no Lavalink:`, error));
                shoukaku.on('ready', (name) => console.log(`[Worker ${data.name}] 🎵 Conectado ao Node Lavalink: ${name}`));

                // Login
                await workerClient.login(token);
                
                // Salva no mapa de workers
                this.workers.set(workerClient.user.id, {
                    id: workerClient.user.id,
                    name: data.name,
                    client: workerClient,
                    shoukaku: shoukaku,
                    busy: false,
                    currentGuild: null
                });

                console.log(`[Orchestrator] ✅ Worker ${data.name} online e pronto.`);

            } catch (error) {
                console.error(`[Orchestrator] ❌ Falha ao iniciar worker ${data.name}:`, error.message);
            }
        }
    }

    // Função para pegar um bot livre
    getFreeWorker(guildId) {
        // Primeiro, verifica se já tem algum bot tocando NESTA guild (para reconectar)
        for (const worker of this.workers.values()) {
            if (worker.currentGuild === guildId) return worker;
        }

        // Se não, pega o primeiro que não esteja ocupado
        for (const worker of this.workers.values()) {
            // Verifica se o shoukaku tem players ativos
            if (worker.shoukaku.players.size === 0) {
                return worker;
            }
        }
        return null; // Todos ocupados
    }
}

// Exporta como Singleton (uma única instância para o bot todo)
module.exports = new MusicOrchestrator();