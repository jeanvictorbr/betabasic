// handlers/buttons/dev_guilds_page.js
const createDevGuildsMenu = require('../../ui/devPanel/devGuildsMenu.js');
const db = require('../../database.js');
const { Routes } = require('discord.js');

const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;
const FINAL_FLAGS = V2_FLAG | EPHEMERAL_FLAG;

module.exports = {
    customId: 'dev_guilds_page_',
    async execute(interaction) {
        if (!interaction.deferred) await interaction.deferUpdate();

        const parts = interaction.customId.split('_');
        const page = parseInt(parts[3]);
        const sortType = parts[4] || 'name';

        let guilds = Array.from(interaction.client.guilds.cache.values());

        if (sortType === 'members') {
            guilds.sort((a, b) => b.memberCount - a.memberCount);
        } else {
            guilds.sort((a, b) => a.name.localeCompare(b.name));
        }

        const itemsPerPage = 5;
        const totalPages = Math.ceil(guilds.length / itemsPerPage);
        const startIndex = page * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentGuilds = guilds.slice(startIndex, endIndex);

        const guildIds = currentGuilds.map(g => g.id);
        let guildSettingsMap = new Map();
        
        if (guildIds.length > 0) {
            try {
                const res = await db.query('SELECT * FROM guild_settings WHERE guild_id = ANY($1)', [guildIds]);
                res.rows.forEach(row => {
                    guildSettingsMap.set(row.guild_id, row);
                });
            } catch (error) {
                console.error("Erro na paginação:", error);
            }
        }

        const menuPayload = createDevGuildsMenu(currentGuilds, page, totalPages, sortType, guildSettingsMap);
        
        try {
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
        } catch (e) {
            console.error(e);
        }
    }
};