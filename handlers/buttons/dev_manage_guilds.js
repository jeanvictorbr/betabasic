// handlers/buttons/dev_manage_guilds.js
const createDevGuildsMenu = require('../../ui/devPanel/devGuildsMenu.js');
const db = require('../../database.js');
const { Routes } = require('discord.js');

const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;
const FINAL_FLAGS = V2_FLAG | EPHEMERAL_FLAG;

module.exports = {
    customId: 'dev_manage_guilds',
    async execute(interaction) {
        // Defere a interação se ainda não foi
        if (!interaction.deferred && !interaction.replied) {
             await interaction.deferUpdate();
        }

        const page = 0;
        const sortType = 'name';

        // 1. Pega e ordena as guildas
        let guilds = Array.from(interaction.client.guilds.cache.values());
        guilds.sort((a, b) => a.name.localeCompare(b.name));

        const itemsPerPage = 5;
        const totalPages = Math.ceil(guilds.length / itemsPerPage);
        const currentGuilds = guilds.slice(0, itemsPerPage);

        // 2. Busca configurações no DB para exibir os ícones (Lógica Assertiva)
        const guildIds = currentGuilds.map(g => g.id);
        let guildSettingsMap = new Map();
        
        if (guildIds.length > 0) {
            try {
                const res = await db.query('SELECT * FROM guild_settings WHERE guild_id = ANY($1)', [guildIds]);
                res.rows.forEach(row => {
                    guildSettingsMap.set(row.guild_id, row);
                });
            } catch (error) {
                console.error("[DevPanel] Erro ao buscar dados:", error);
            }
        }

        // 3. Gera o Menu (Passando os argumentos na ordem correta)
        const menuPayload = createDevGuildsMenu(currentGuilds, page, totalPages, sortType, guildSettingsMap);

        try {
            // 4. Envia via REST para evitar o erro 50035 (Flag V2)
            await interaction.client.rest.patch(
                Routes.webhookMessage(interaction.applicationId, interaction.token, '@original'),
                {
                    body: {
                        embeds: menuPayload.embeds,
                        components: menuPayload.components,
                        flags: FINAL_FLAGS
                    }
                }
            );
        } catch (error) {
            console.error('Erro ao atualizar painel dev:', error);
        }
    }
};