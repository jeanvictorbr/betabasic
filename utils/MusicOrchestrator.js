const { Client, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');
const { SpotifyExtractor, SoundCloudExtractor } = require('@discord-player/extractor'); // Importa manualmente
const db = require('../database.js');
const { decrypt } = require('./encryption.js');

class MusicOrchestrator {
    constructor() {
        this.workers = new Map();
    }

    async start() {
        console.log('[Orchestrator] 🎻 Iniciando Sistema "SoundCloud Bridge" (Sem YouTube)...');
        
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
                    skipFFmpeg: false, // Usa ffmpeg-static
                    ytdlOptions: { quality: 'highestaudio', highWaterMark: 1 << 25 }
                });

                // --- CONFIGURAÇÃO DE EXTRATORES ---
                try {
                    // 1. Registra o SoundCloud (nossa fonte de áudio principal)
                    await player.extractors.register(SoundCloudExtractor, {});

                    // 2. Registra o Spotify e manda ele usar o SoundCloud como ponte
                    // Isso evita o erro de "Could not load youtube library"
                    await player.extractors.register(SpotifyExtractor, {
                        bridgeProvider: 'soundcloud' 
                    });

                    // NÃO carregamos o loadDefault() para evitar o YouTubeExtractor
                    
                    console.log(`[Worker ${data.name}] 📦 Modo Spotify -> SoundCloud Ativado.`);
                } catch (extError) {
                    console.error(`[Worker ${data.name}] ⚠️ Erro extratores: ${extError.message}`);
                }
                // ----------------------------------

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