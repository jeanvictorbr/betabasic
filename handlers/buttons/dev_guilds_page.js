// handlers/buttons/dev_guilds_page.js
const createDevGuildsMenu = require('../../ui/devPanel/devGuildsMenu.js');
const db = require('../../database.js');

module.exports = {
    customId: 'dev_guilds_page_',
    async execute(interaction) {
        await interaction.deferUpdate();

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

        // --- BUSCA DE DADOS PARA A PÁGINA ATUAL ---
        const guildIds = currentGuilds.map(g => g.id);
        let guildSettingsMap = new Map();
        
        if (guildIds.length > 0) {
            try {
                const res = await db.query('SELECT * FROM guild_settings WHERE guild_id = ANY($1)', [guildIds]);
                res.rows.forEach(row => {
                    guildSettingsMap.set(row.guild_id, row);
                });
            } catch (error) {
                console.error("[DevPanel] Erro na paginação:", error);
            }
        }

        const payload = createDevGuildsMenu(interaction, currentGuilds, page, totalPages, sortType, guildSettingsMap);
        
        await interaction.editReply(payload);
    }
};