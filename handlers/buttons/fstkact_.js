const db = require('../../database.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const updateVitrine = require('../../utils/updateFerrariVitrine.js');

module.exports = {
    customId: 'fstkact_', 
    execute: async (interaction, guildSettings) => {
        const action = interaction.customId.split('_')[1]; // Pega 'add' ou 'rem'
        const id = interaction.customId.split('_')[2];     // Pega o ID do carro

        const res = await db.query('SELECT * FROM ferrari_stock_products WHERE id = $1 AND guild_id = $2', [id, interaction.guildId]);
        let v = res.rows[0];
        if(!v) return interaction.update({ content: '❌ Erro: Veículo não encontrado no banco.', components: [], embeds: [] });

        let oldQtd = v.quantity;
        let newQtd = action === 'add' ? oldQtd + 1 : oldQtd - 1;

        if (newQtd < 0) return interaction.followUp({ content: '❌ Operação cancelada. O estoque não pode ficar negativo!', ephemeral: true });

        // 1. Atualiza no Banco
        await db.query('UPDATE ferrari_stock_products SET quantity = $1 WHERE id = $2', [newQtd, id]);

        // 2. Chama a atualização das Vitrines Globais e do Site (Síncrono)
        try {
            await updateVitrine(interaction.client, interaction.guildId);
            if (interaction.client.io) {
                interaction.client.io.emit('estoque_atualizado');
            }
        } catch(e) { console.error("[FSTK] Erro ao sincronizar vitrines:", e); }

        // 3. O SISTEMA DE LOGS SUPREMO
        const logChannelId = guildSettings?.ferrari_logs_channel; // Criado no nosso comando /ferrari-logs
        if (logChannelId) {
            const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle(action === 'add' ? '📦 Estoque Adicionado' : '📦 Estoque Removido')
                    .setColor(action === 'add' ? '#2ECC71' : '#E74C3C')
                    .addFields(
                        { name: 'Veículo', value: `🚗 **${v.name}**`, inline: true },
                        { name: 'Categoria', value: v.category || 'Carros', inline: true },
                        { name: 'Ação', value: action === 'add' ? '➕ Adicionado (+1)' : '➖ Removido (-1)', inline: false },
                        { name: 'Estoque Anterior', value: `\`${oldQtd}\` unidades`, inline: true },
                        { name: 'Estoque Novo', value: `\`${newQtd}\` unidades`, inline: true },
                        { name: 'Staff Responsável', value: `<@${interaction.user.id}>`, inline: false }
                    )
                    .setTimestamp();
                await logChannel.send({ embeds: [logEmbed] }).catch(()=>{});
            }
        }

        // 4. Atualiza a mensagem efêmera do Staff na hora
        const embed = new EmbedBuilder()
            .setTitle(`🔧 Gerenciando: ${v.name}`)
            .setDescription(`✅ **Estoque Atualizado com Sucesso!**\n\nCategoria: **${v.category || 'Carros'}**\nEstoque Atual: \`${newQtd}\` unidades`)
            .setColor(action === 'add' ? '#2ECC71' : '#E74C3C');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`fstkact_add_${v.id}`).setLabel('Adicionar +1').setStyle(ButtonStyle.Success).setEmoji('➕'),
            new ButtonBuilder().setCustomId(`fstkact_rem_${v.id}`).setLabel('Remover -1').setStyle(ButtonStyle.Danger).setEmoji('➖')
        );

        await interaction.update({ embeds: [embed], components: [row] });
    }
};