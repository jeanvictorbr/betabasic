const db = require('../../database.js');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { formatKK } = require('../../utils/rpCurrency.js');
const updateVitrine = require('../../utils/updateFerrariVitrine.js'); 

module.exports = {
    customId: 'fc_approve_',
    async execute(interaction, guildSettings) {
        // 1. VERIFICAÇÃO DE PERMISSÃO SÊNIOR (Permite a tag Staff OU quem for Administrador do Discord)
        const hasStaffRole = guildSettings?.ferrari_staff_role && interaction.member.roles.cache.has(guildSettings.ferrari_staff_role);
        const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!hasStaffRole && !isAdmin) {
            return interaction.reply({ content: '❌ Acesso Negado: Apenas a Staff da loja ou Administradores podem aprovar compras.', ephemeral: true });
        }

        const productId = interaction.customId.replace('fc_approve_', '');
        await interaction.deferReply();

        try {
            // 2. DEDUZ O ESTOQUE NO BANCO DE DADOS
            const res = await db.query('UPDATE ferrari_stock_products SET quantity = quantity - 1 WHERE id = $1 AND quantity > 0 RETURNING *', [productId]);
            const product = res.rows[0];

            if (!product) {
                return interaction.editReply('❌ **Erro:** Esta venda não pode ser concluída. O veículo já esgotou ou foi removido do sistema.');
            }

            // 3. O PULO DO GATO: Se o estoque zerou, apaga o produto pra limpar a vitrine de vez!
            if (product.quantity <= 0) {
                await db.query('DELETE FROM ferrari_stock_products WHERE id = $1', [productId]);
            }

            // 4. ATUALIZA O DISCORD (Bot)
            await updateVitrine(interaction.client, interaction.guildId);

            // 5. ATUALIZA O SITE (Envia o sinal pelo WebSocket)
            if (interaction.client.io) {
                interaction.client.io.emit('estoque_atualizado');
            }

            // 6. LOG DE AUDITORIA E CHEFIA (TEMA AZUL)
            if (guildSettings?.ferrari_log_channel) {
                const logChannel = await interaction.guild.channels.fetch(guildSettings.ferrari_log_channel).catch(()=>null);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('✅ Venda de Veículo Aprovada!')
                        .setColor('#3b82f6') // Azul Premium
                        .addFields(
                            { name: 'Veículo Comprado', value: product.name, inline: true },
                            { name: 'Valor', value: formatKK(Number(product.price_kk)), inline: true },
                            { name: 'Aprovado por', value: `<@${interaction.user.id}>`, inline: false },
                            { name: 'Estoque Restante', value: product.quantity <= 0 ? '🚫 Esgotado (Removido da Vitrine)' : product.quantity.toString(), inline: false }
                        )
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] }).catch(()=>{});
                }
            }

            // 7. FECHAMENTO DO CARRINHO
            await interaction.editReply(`✅ **Compra Aprovada com Sucesso!**\nO estoque de **${product.name}** foi atualizado e as vitrines foram sincronizadas.\nO canal do carrinho será fechado em 10 segundos...`);
            
            setTimeout(() => {
                interaction.channel.delete().catch(()=>{});
            }, 10000);

        } catch (e) {
            console.error('[fc_approve] Erro crítico ao aprovar:', e);
            await interaction.editReply('❌ Ocorreu um erro interno ao tentar deduzir o estoque e atualizar as vitrines.');
        }
    }
};