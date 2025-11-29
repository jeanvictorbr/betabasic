// handlers/buttons/dev_guilds_page.js
const createDevGuildsMenu = require('../../ui/devPanel/devGuildsMenu.js');
const db = require('../../database.js'); // Importante: Database Wrapper

module.exports = {
    customId: 'dev_guilds_page_', // Rota dinâmica para paginação
    async execute(interaction) {
        // Formato esperado do ID: dev_guilds_page_NUMEROPAGINA_TIPOORDENACAO
        const parts = interaction.customId.split('_');
        const page = parseInt(parts[3]);
        const sortType = parts[4] || 'name'; // 'name' ou 'members'

        // 1. Obter e Ordenar Guildas
        let guilds = Array.from(interaction.client.guilds.cache.values());

        if (sortType === 'members') {
            guilds.sort((a, b) => b.memberCount - a.memberCount);
        } else {
            guilds.sort((a, b) => a.name.localeCompare(b.name));
        }

        // 2. Paginação
        const itemsPerPage = 5; // Mantém 5 para caber na descrição detalhada
        const totalPages = Math.ceil(guilds.length / itemsPerPage);
        const startIndex = page * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentGuilds = guilds.slice(startIndex, endIndex);

        // 3. Buscar Configurações no Banco de Dados (NOVO)
        // Extrai apenas os IDs da página atual para não pesar o banco
        const guildIds = currentGuilds.map(g => g.id);
        
        let guildSettingsMap = new Map();
        
        if (guildIds.length > 0) {
            try {
                // Usa o operador ANY para buscar vários IDs de uma vez
                const res = await db.query('SELECT * FROM guild_settings WHERE guild_id = ANY($1)', [guildIds]);
                
                // Popula o Map
                res.rows.forEach(row => {
                    guildSettingsMap.set(row.guild_id, row);
                });
            } catch (error) {
                console.error("Erro ao buscar settings para o DevPanel:", error);
            }
        }

        // 4. Gerar UI atualizada com Map de configurações
        const payload = createDevGuildsMenu(interaction, currentGuilds, page, totalPages, sortType, guildSettingsMap);
        
        await interaction.update(payload);
    }
};