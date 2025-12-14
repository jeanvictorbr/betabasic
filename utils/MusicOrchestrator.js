const { Client, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');
// Importa a nova lib estável para stream
const { YoutubeI } = require("discord-player-youtubei");
const db = require('../database.js');
const { decrypt } = require('./encryption.js');

class MusicOrchestrator {
    constructor() {
        this.workers = new Map();
    }

    async start() {
        console.log('[Orchestrator] 🎻 Iniciando Sistema Híbrido (Spotify Search + YouTubeI Stream)...');
        
        const result = await db.query('SELECT * FROM music_workers WHERE is_active = true');
        const workersData = result.rows;

        if (workersData.length === 0) {
            console.log('[Orchestrator] ⚠️ Nenhum worker no banco.');
            return;
        }

        for (const data of workersData) {
            try {
                const token = decrypt({ content: data.token_enc, iv: data.iv });
                if (!token) continue;

                const workerClient = new Client({
                    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
                });

                const player = new Player(workerClient, {
                    skipFFmpeg: false,
                    ytdlOptions: { quality: 'highestaudio', highWaterMark: 1 << 25 }
                });

                // --- CARREGAMENTO DOS EXTRATORES ---
                try {
                    // 1. Registra o YoutubeI (Engine de áudio mais forte)
                    await player.extractors.register(YoutubeI, {});
                    
                    // 2. Carrega os padrões (Inclui Spotify para busca)
                    await player.extractors.loadDefault();
                    
                    console.log(`[Worker ${data.name}] 📦 Extratores carregados: Spotify, YoutubeI, SoundCloud.`);
                } catch (extError) {
                    console.error(`[Worker ${data.name}] ⚠️ Erro extratores: ${extError.message}`);
                }
                // ----------------------------------

                // Tratamento de Erros para não derrubar o bot
                player.events.on('error', (queue, error) => console.log(`[${data.name}] Erro Fila: ${error.message}`));
                player.events.on('playerError', (queue, error) => console.log(`[${data.name}] Erro Player: ${error.message}`));

                await workerClient.login(token);

                this.workers.set(workerClient.user.id, {
                    id: workerClient.user.id,
                    name: data.name,
                    client: workerClient,
                    player: player, 
                    busy: false,
                    currentGuild: null
                });

                console.log(`[Orchestrator] ✅ Worker ${data.name} ONLINE.`);

            } catch (error) {
                console.error(`[Orchestrator] ❌ Falha ao iniciar ${data.name}:`, error.message);
            }
        }
    }

    getFreeWorker(guildId) {
        // Tenta reconectar a um worker que já esteja nesta guilda
        for (const worker of this.workers.values()) {
            if (worker.currentGuild === guildId) return worker;
            // Checagem extra de voz
            const guild = worker.client.guilds.cache.get(guildId);
            if (guild && guild.members.me && guild.members.me.voice.channelId) {
                return worker; 
            }
        }

        // Busca livre
        for (const worker of this.workers.values()) {
            if (!worker.busy && worker.player.nodes.cache.size === 0) {
                return worker;
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