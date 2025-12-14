const { Client, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
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
                // Criamos um Player dedicado para este bot específico
                const player = new Player(workerClient, {
                    skipFFmpeg: false, // Usa o ffmpeg local
                    ytdlOptions: {
                        quality: 'highestaudio',
                        highWaterMark: 1 << 25
                    }
                });

                // Carrega extratores (YouTube, Spotify, SoundCloud)
                await player.extractors.loadMulti(DefaultExtractors);

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
                    player: player, // Guardamos o player aqui
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
        // 1. Prioridade: Se já tem um worker nesta guild, usa ele
        for (const worker of this.workers.values()) {
            if (worker.currentGuild === guildId) return worker;
        }

        // 2. Busca um livre (que não esteja tocando nada)
        for (const worker of this.workers.values()) {
            // Verifica se o player tem nodes ativos
            if (!worker.player.nodes.has(guildId) && !worker.busy) {
                return worker;
            }
        }
        return null;
    }
    
    // Libera o worker manualmente se precisar
    releaseWorker(workerId) {
        const worker = this.workers.get(workerId);
        if (worker) {
            worker.busy = false;
            worker.currentGuild = null;
        }
    }
}

module.exports = new MusicOrchestrator();