const db = require('../../database.js');
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    customId: 'fstk_sel_cat',
    execute: async (interaction) => {
        const categoria = interaction.values[0];
        
        // Puxa os veículos dessa categoria
        const res = await db.query('SELECT id, name, quantity FROM ferrari_stock_products WHERE guild_id = $1 AND category = $2 ORDER BY name ASC LIMIT 25', [interaction.guildId, categoria]);
        
        if (res.rows.length === 0) return interaction.update({ content: `❌ Nenhum veículo encontrado na categoria **${categoria}** no momento.`, components: [] });

        const select = new StringSelectMenuBuilder()
            .setCustomId('fstk_sel_veh')
            .setPlaceholder(`🚘 Selecione o veículo (${categoria})...`)
            .addOptions(res.rows.map(v => ({ 
                label: v.name.substring(0, 99), 
                description: `Estoque Atual: ${v.quantity} unidades`, 
                value: v.id.toString(),
                emoji: '🔧'
            })));

        await interaction.update({ content: `Categoria selecionada: **${categoria}**\nAgora, selecione o **Veículo** que deseja alterar:`, components: [new ActionRowBuilder().addComponents(select)] });
    }
};