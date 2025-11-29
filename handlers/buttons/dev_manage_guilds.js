// handlers/buttons/dev_manage_guilds.js
const createDevGuildsMenu = require('../../ui/devPanel/devGuildsMenu.js');
const db = require('../../database.js');

module.exports = {
    customId: 'dev_manage_guilds',
    async execute(interaction) {
        await interaction.deferUpdate(); // Usa update pois é um botão

        const page = 0;
        const sortType = 'name';

        let guilds = Array.from(interaction.client.guilds.cache.values());
        guilds.sort((a, b) => a.name.localeCompare(b.name));

        const itemsPerPage = 5;
        const totalPages = Math.ceil(guilds.length / itemsPerPage);
        const currentGuilds = guilds.slice(0, itemsPerPage);

        // --- BUSCA INTELIGENTE DE DADOS ---
        const guildIds = currentGuilds.map(g => g.id);
        let guildSettingsMap = new Map();
        
        if (guildIds.length > 0) {
            try {
                // Busca configurações APENAS das guildas dessa página
                const res = await db.query('SELECT * FROM guild_settings WHERE guild_id = ANY($1)', [guildIds]);
                res.rows.forEach(row => {
                    guildSettingsMap.set(row.guild_id, row);
                });
            } catch (error) {
                console.error("[DevPanel] Erro ao buscar dados:", error);
            }
        }

        const payload = createDevGuildsMenu(interaction, currentGuilds, page, totalPages, sortType, guildSettingsMap);
        
        await interaction.editReply(payload);
    }
};