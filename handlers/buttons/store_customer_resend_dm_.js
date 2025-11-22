// File: handlers/buttons/store_customer_resend_dm_.js
const db = require('../../database.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    customId: 'store_customer_resend_dm_',
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const saleId = interaction.customId.split('_').pop();

        try {
            const orderResult = await db.query('SELECT * FROM store_sales_log WHERE sale_id = $1', [saleId]);
            const order = orderResult.rows[0];

            if (!order) return interaction.editReply('❌ Pedido inválido.');

            // Tenta enviar a DM
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle(`📦 Resgate de Pedido #${saleId}`)
                    .setDescription(`Olá! Aqui estão os detalhes da sua compra realizada em <t:${Math.floor(new Date(order.created_at).getTime() / 1000)}:f>.`)
                    .addFields(
                        { name: 'Produtos', value: (order.product_details || []).map(p => `• ${p.name}`).join('\n') }
                    )
                    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

                // NOTA: Para um sistema perfeito de chaves, você precisaria buscar na tabela store_stock
                // quais chaves foram entregues para este usuário neste pedido.
                // Como o sales_log atual salva o JSON genérico, enviaremos as informações básicas.
                
                await interaction.user.send({ embeds: [dmEmbed] });
                await interaction.editReply('✅ **Sucesso!** Verifique suas Mensagens Diretas (DM).');

            } catch (dmError) {
                await interaction.editReply('❌ **Erro:** Não consegui te enviar mensagem no privado. Verifique se suas DMs estão abertas.');
            }

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Erro interno.');
        }
    }
};