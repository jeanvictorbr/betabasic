const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const db = require('../../database.js');

module.exports = {
    customId: 'select_store_remove_product',
    execute: async (interaction, client) => {
        // Recupera o ID do produto selecionado
        const productId = interaction.values[0];

        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // Busca detalhes do produto para mostrar na confirmação
            const result = await db.query('SELECT name, price FROM store_products WHERE id = $1 AND guild_id = $2', [productId, interaction.guild.id]);
            
            if (result.rowCount === 0) {
                return interaction.editReply({ content: '❌ Produto não encontrado ou já excluído.' });
            }

            const product = result.rows[0];

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Confirmar Exclusão')
                .setDescription(`Você tem certeza que deseja remover o produto permanentemente?\n\n📦 **Produto:** ${product.name}\n💰 **Preço:** R$ ${product.price}`)
                .setColor('#FF0000');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`store_confirm_delete_${productId}`) // Passa o ID no botão
                    .setLabel('Confirmar Exclusão')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🗑️'),
                new ButtonBuilder()
                    .setCustomId('delete_ephemeral_reply')
                    .setLabel('Cancelar')
                    .setStyle(ButtonStyle.Secondary)
            );

            await interaction.editReply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Erro ao selecionar produto para remover:', error);
            // Fallback seguro se não der pra editar
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Erro ao processar seleção.', flags: MessageFlags.Ephemeral });
            }
        }
    }
};