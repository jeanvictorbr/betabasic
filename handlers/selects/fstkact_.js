const db = require('../../database.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const updateVitrine = require('../../utils/updateFerrariVitrine.js');

module.exports = {
    customId: 'fstkact_', 
    execute: async (interaction, guildSettings) => {
        const action = interaction.customId.split('_')[1]; 
        const id = interaction.customId.split('_')[2];     

        const res = await db.query('SELECT * FROM ferrari_stock_products WHERE id = $1 AND guild_id = $2', [id, interaction.guildId]);
        let v = res.rows[0];
        if(!v) return interaction.update({ content: '❌ Veículo não encontrado.', embeds: [], components: [] });

        let logAction = '';
        let newQtd = v.quantity;

        // Executa a Exclusão
        if (action === 'del') {
            await db.query('DELETE FROM ferrari_stock_products WHERE id = $1', [id]);
            logAction = '🗑️ Veículo Excluído';
        } else {
            // Executa a Alteração de Estoque
            newQtd = action === 'add' ? v.quantity + 1 : v.quantity - 1;
            if (newQtd < 0) return interaction.followUp({ content: '❌ O estoque não pode ficar negativo!', ephemeral: true });
            await db.query('UPDATE ferrari_stock_products SET quantity = $1 WHERE id = $2', [newQtd, id]);
            logAction = action === 'add' ? '➕ Adicionado (+1)' : '➖ Removido (-1)';
        }

        // Atualiza Vitrines na hora
        try {
            await updateVitrine(interaction.client, interaction.guildId);
            if (interaction.client.io) interaction.client.io.emit('estoque_atualizado');
        } catch(e) {}

        // Envia os Logs
        const logChannelId = guildSettings?.ferrari_logs_channel;
        if (logChannelId) {
            const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
            if (logChannel) {
                const logEmbed = new EmbedBuilder().setTitle(action === 'del' ? '🗑️ Exclusão de Estoque' : '📦 Alteração de Estoque')
                    .setColor(action === 'add' ? '#2ECC71' : '#E74C3C')
                    .addFields(
                        { name: 'Veículo', value: v.name, inline: true },
                        { name: 'Ação', value: logAction, inline: true },
                        { name: 'Staff', value: `<@${interaction.user.id}>`, inline: false }
                    ).setTimestamp();
                await logChannel.send({ embeds: [logEmbed] }).catch(()=>{});
            }
        }

        if (action === 'del') {
            return interaction.update({ content: `✅ O veículo **${v.name}** foi totalmente excluído da loja.`, embeds: [], components: [] });
        }

        // Atualiza a mensagem da Staff
        const embed = new EmbedBuilder().setTitle(`🔧 Editando: ${v.name}`).setDescription(`✅ Atualizado com sucesso!\nEstoque Atual: \`${newQtd}\` unidades`).setColor('#2ECC71');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`fstkact_add_${v.id}`).setLabel('+1').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`fstkact_rem_${v.id}`).setLabel('-1').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`fstkact_del_${v.id}`).setLabel('Excluir').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
        );

        await interaction.update({ embeds: [embed], components: [row] });
    }
};