const db = require('../../database.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    customId: 'fstk_sel_veh',
    execute: async (interaction) => {
        const id = interaction.values[0];
        const res = await db.query('SELECT * FROM ferrari_stock_products WHERE id = $1', [id]);
        const v = res.rows[0];
        if(!v) return interaction.update({ content: '❌ Veículo não encontrado.', components: [] });

        const embed = new EmbedBuilder().setTitle(`🔧 Editando: ${v.name}`).setDescription(`Estoque Atual: \`${v.quantity}\` unidades`).setColor('#3b82f6');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`fstkact_add_${v.id}`).setLabel('+1').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`fstkact_rem_${v.id}`).setLabel('-1').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`fstkact_del_${v.id}`).setLabel('Excluir').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
        );

        await interaction.update({ content: '', embeds: [embed], components: [row] });
    }
};