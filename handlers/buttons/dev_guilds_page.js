const { SelectMenuBuilder, ActionRowBuilder } = require('discord.js'); // Usado internamente se precisar
const devGuildsMenu = require('../../ui/devPanel/devGuildsMenu');

module.exports = {
    customId: 'dev_guilds_page',
    run: async (client, interaction) => {
        try {
            // Pega todas as guildas do cache
            let guilds = Array.from(client.guilds.cache.values());

            // --- MELHORIA DE FAXINA ---
            // Ordena por número de membros (Crescente: Menos membros primeiro)
            // Assim as guildas "fantasmas" aparecem no topo da página 1.
            guilds.sort((a, b) => a.memberCount - b.memberCount);
            // --------------------------

            // Lógica de paginação simples (se tiver info no customId, ex: dev_guilds_page_2)
            let page = 0;
            const parts = interaction.customId.split('_');
            if (parts.length > 3) {
                page = parseInt(parts[3]) || 0;
            }

            const ui = devGuildsMenu(guilds, page);
            
            if (interaction.isMessageComponent()) {
                await interaction.update(ui);
            } else {
                await interaction.reply(ui);
            }

        } catch (err) {
            console.error(err);
            // Fallback erro simples
        }
    }
};