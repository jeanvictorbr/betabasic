const db = require('../../database.js');
const { EmbedBuilder } = require('discord.js');
const { formatKK } = require('../../utils/rpCurrency.js');
const updateVitrine = require('../../utils/updateFerrariVitrine.js'); // Importamos o motor

module.exports = {
    customId: 'fc_approve_',
    async execute(interaction, guildSettings) {
        if (!guildSettings?.ferrari_staff_role || !interaction.member.roles.cache.has(guildSettings.ferrari_staff_role)) {
            return interaction.reply({ content: '❌ Apenas a Staff pode autorizar.', ephemeral: true });
        }

        const productId = interaction.customId.replace('fc_approve_', '');
        await interaction.deferReply();

        try {
            // Deduz o estoque
            const res = await db.query('UPDATE ferrari_stock_products SET quantity = quantity - 1 WHERE id = $1 AND quantity > 0 RETURNING *', [productId]);
            const product = res.rows[0];

            if (!product) return interaction.editReply('❌ Estoque esgotado no meio do processo ou erro ao atualizar.');

            // Atualiza a vitrine ao vivo
            await updateVitrine(interaction.client, interaction.guildId);

            // Log de Chefia
            if (guildSettings.ferrari_log_channel) {
                const logChannel = await interaction.guild.channels.fetch(guildSettings.ferrari_log_channel).catch(()=>null);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('📦 Venda de Estoque Aprovada!')
                        .setColor('#00ff00')
                        .addFields(
                            { name: 'Produto', value: product.name, inline: true },
                            { name: 'Preço Pago', value: formatKK(Number(product.price_kk)), inline: true },
                            { name: 'Aprovado por', value: `<@${interaction.user.id}>`, inline: false },
                            { name: 'Estoque Restante', value: product.quantity.toString(), inline: false }
                        ).setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

            await interaction.editReply('✅ Pagamento Aprovado e Estoque deduzido! Fechando carrinho em 10s...');
            setTimeout(() => interaction.channel.delete().catch(()=>{}), 10000);

        } catch (e) {
            console.error(e);
            await interaction.editReply('❌ Erro crítico ao autorizar.');
        }
    }
};