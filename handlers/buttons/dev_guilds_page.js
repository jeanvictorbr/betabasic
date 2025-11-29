const database = require('../../database');
const devGuildsMenu = require('../../ui/devPanel/devGuildsMenu');

module.exports = {
    customId: 'dev_guilds_page',
    run: async (client, interaction) => {
        try {
            // 1. Evita "Falha na Interação" respondendo imediatamente ao clique
            if (interaction.isMessageComponent()) {
                await interaction.deferUpdate();
            }

            // 2. Pega todas as guildas do cache
            let guilds = Array.from(client.guilds.cache.values());

            // Ordena: Menos membros primeiro (foco em limpeza)
            guilds.sort((a, b) => a.memberCount - b.memberCount);

            // Paginação (10 por página devido ao limite do Select Menu)
            let page = 0;
            const parts = interaction.customId.split('_');
            if (parts.length > 3) {
                page = parseInt(parts[3]) || 0;
            }

            const start = page * 10;
            const end = start + 10;
            const currentGuilds = guilds.slice(start, end);

            // 3. Otimização: Buscar dados do DB apenas para as 10 guildas da página atual
            // Isso evita travar o bot carregando milhares de registros
            const guildIds = currentGuilds.map(g => g.id);
            const enrichedGuilds = [];

            if (guildIds.length > 0) {
                const db = await database.getClient();
                try {
                    // Busca módulos ativos dessas guildas
                    const modulesRes = await db.query(
                        `SELECT * FROM guild_modules WHERE guild_id = ANY($1)`, 
                        [guildIds]
                    );

                    // Processa cada guilda para adicionar infos extras
                    for (const guild of currentGuilds) {
                        const dbData = modulesRes.rows.find(row => row.guild_id === guild.id);
                        
                        // Conta módulos ativos
                        let activeCount = 0;
                        if (dbData) {
                            for (const [key, value] of Object.entries(dbData)) {
                                if (value === true && key.endsWith('_system')) activeCount++;
                            }
                        }

                        // Define Saúde
                        const days = Math.floor((Date.now() - guild.joinedTimestamp) / (1000 * 60 * 60 * 24));
                        let healthEmoji = "🟢"; // Saudável
                        let statusText = "Ativo";

                        if (activeCount === 0 && days > 7) {
                            healthEmoji = "🔴"; // Fantasma/Inativa
                            statusText = "FANTASMA";
                        } else if (activeCount === 0) {
                            healthEmoji = "🟡"; // Config Pendente
                            statusText = "S/ Config";
                        } else if (guild.memberCount < 3 && days > 30) {
                            healthEmoji = "🟠"; // Abandonada
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

            // 4. Chama a UI atualizada
            const ui = devGuildsMenu(enrichedGuilds, page, guilds.length);
            
            await interaction.editReply(ui);

        } catch (err) {
            console.error('[DevPanel Error]', err);
            // Tenta avisar se der erro
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Erro ao carregar lista.', ephemeral: true });
            }
        }
    }
};