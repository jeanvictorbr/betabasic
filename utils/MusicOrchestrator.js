const { Client, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');
const { SoundCloudExtractor } = require('@discord-player/extractor');
const db = require('../database.js');
const { decrypt } = require('./encryption.js');

class MusicOrchestrator {
    constructor() {
        this.workers = new Map();
    }

    async start() {
        console.log('[Orchestrator] 🎻 Iniciando Sistema Nativo (SoundCloud ONLY)...');
        
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

                // --- CARREGAMENTO LIMPO ---
                try {
                    // Registra APENAS o SoundCloud.
                    // Isso evita qualquer erro relacionado a YouTube/Spotify bloqueados.
                    await player.extractors.register(SoundCloudExtractor, {});
                    
                    console.log(`[Worker ${data.name}] 📦 Extrator SoundCloud: ATIVO`);
                } catch (extError) {
                    console.error(`[Worker ${data.name}] ⚠️ Erro extrator: ${extError.message}`);
                }
                // --------------------------

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
                console.error(`[Orchestrator] ❌ Falha no worker ${data.name}:`, error.message);
            }
        }
    }

    getFreeWorker(guildId) {
        for (const worker of this.workers.values()) {
            if (worker.currentGuild === guildId) return worker;
            const guild = worker.client.guilds.cache.get(guildId);
            if (guild && guild.members.me && guild.members.me.voice.channelId) {
                return worker; 
            }
        }
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