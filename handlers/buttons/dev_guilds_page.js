const database = require('../../database');
const devGuildsMenu = require('../../ui/devPanel/devGuildsMenu');

module.exports = {
    customId: 'dev_guilds_page',
    run: async (client, interaction) => {
        try {
            // 1. Sinaliza ao Discord que estamos processando (evita "Falha na Interação")
            if (interaction.isMessageComponent()) {
                await interaction.deferUpdate();
            }

            // 2. Pega todas as guildas do cache e ordena
            let guilds = Array.from(client.guilds.cache.values());
            guilds.sort((a, b) => a.memberCount - b.memberCount);

            // Paginação
            let page = 0;
            const parts = interaction.customId.split('_');
            if (parts.length > 3) {
                page = parseInt(parts[3]) || 0;
            }

            const start = page * 10;
            const end = start + 10;
            const currentGuilds = guilds.slice(start, end);

            // 3. Enriquecimento de Dados (Busca no DB)
            const guildIds = currentGuilds.map(g => g.id);
            const enrichedGuilds = [];

            if (guildIds.length > 0) {
                const db = await database.getClient();
                try {
                    const modulesRes = await db.query(
                        `SELECT * FROM guild_modules WHERE guild_id = ANY($1)`, 
                        [guildIds]
                    );

                    for (const guild of currentGuilds) {
                        const dbData = modulesRes.rows.find(row => row.guild_id === guild.id);
                        
                        let activeCount = 0;
                        if (dbData) {
                            for (const [key, value] of Object.entries(dbData)) {
                                if (value === true && key.endsWith('_system')) activeCount++;
                            }
                        }

                        const days = Math.floor((Date.now() - guild.joinedTimestamp) / (1000 * 60 * 60 * 24));
                        let healthEmoji = "🟢"; 
                        let statusText = "Ativo";

                        if (activeCount === 0 && days > 7) {
                            healthEmoji = "🔴"; 
                            statusText = "FANTASMA";
                        } else if (activeCount === 0) {
                            healthEmoji = "🟡"; 
                            statusText = "S/ Config";
                        } else if (guild.memberCount < 3 && days > 30) {
                            healthEmoji = "🟠"; 
                            statusText = "Abandonada";
                        }

                        enrichedGuilds.push({
                            id: guild.id,
                            name: guild.name,
                            memberCount: guild.memberCount,
                            joinedDays: days,
                            activeModules: activeCount,
                            healthEmoji,
                            statusText
                        });
                    }
                } finally {
                    db.release();
                }
            }

            // 4. Gera a UI e Desempacota o Body
            const ui = devGuildsMenu(enrichedGuilds, page, guilds.length);
            
            // CORREÇÃO CRÍTICA: Passar ui.body, não ui inteiro
            await interaction.editReply(ui.body);

        } catch (err) {
            console.error('[DevPanel Error]', err);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Erro ao carregar lista.', ephemeral: true });
            }
        }
    }
};s