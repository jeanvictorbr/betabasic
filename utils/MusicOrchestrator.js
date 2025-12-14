// utils/MusicOrchestrator.js
const { Client, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');
const db = require('../database.js');
const { decrypt } = require('./encryption.js');

class MusicOrchestrator {
    constructor() {
        this.workers = new Map(); // Armazena { id, client, player, name, busy, currentGuild }
    }

    async start() {
        console.log('[Orchestrator] 🎻 Iniciando Sistema Nativo (Discord-Player)...');
        
        // 1. Buscar bots no banco
        const result = await db.query('SELECT * FROM music_workers WHERE is_active = true');
        const workersData = result.rows;

        if (workersData.length === 0) {
            console.log('[Orchestrator] ⚠️ Nenhum worker no banco.');
            return;
        }

        // 2. Inicializar cada bot
        for (const data of workersData) {
            try {
                const token = decrypt({ content: data.token_enc, iv: data.iv });
                if (!token) continue;

                // Cliente do Worker
                const workerClient = new Client({
                    intents: [
                        GatewayIntentBits.Guilds,
                        GatewayIntentBits.GuildVoiceStates
                    ]
                });

                // --- A MÁGICA DO DISCORD PLAYER ---
                const player = new Player(workerClient, {
                    skipFFmpeg: false,
                    ytdlOptions: {
                        quality: 'highestaudio',
                        highWaterMark: 1 << 25
                    }
                });

                // --- CORREÇÃO AQUI ---
                // Removemos o loadMulti que estava dando erro e usamos o padrão
                await player.extractors.loadDefault();
                // ---------------------

                // Logs de erro do player
                player.events.on('error', (queue, error) => {
                    console.log(`[Worker ${data.name}] Erro na fila: ${error.message}`);
                });
                player.events.on('playerError', (queue, error) => {
                    console.log(`[Worker ${data.name}] Erro na conexão: ${error.message}`);
                });

                // Login do Worker
                await workerClient.login(token);

                this.workers.set(workerClient.user.id, {
                    id: workerClient.user.id,
                    name: data.name,
                    client: workerClient,
                    player: player, 
                    busy: false,
                    currentGuild: null
                });

                console.log(`[Orchestrator] ✅ Worker ${data.name} pronto (Engine: FFmpeg)`);

            } catch (error) {
                console.error(`[Orchestrator] Falha no worker ${data.name}:`, error.message);
            }
        }
    }

    getFreeWorker(guildId) {
        // 1. Prioridade: Se já tem um worker nesta guild, usa ele (para filas)
        for (const worker of this.workers.values()) {
            if (worker.currentGuild === guildId) return worker;
        }

        // 2. Busca um livre
        for (const worker of this.workers.values()) {
            // Verifica se o worker não está marcado como ocupado
            // E verifica se o player dele não tem fila ativa na memória
            if (!worker.busy && (!worker.player.nodes.has(guildId))) {
                // Verificação extra: se ele não tem NENHUM node ativo em lugar nenhum
                if (worker.player.nodes.cache.size === 0) {
                    return worker;
                }
            }
        }
        return null;
    }
    
    releaseWorker(workerId) {
        const worker = this.workers.get(workerId);
        if (worker) {
            worker.busy = false;
            worker.currentGuild = null;
        }
    }
}

module.exports = new MusicOrchestrator();