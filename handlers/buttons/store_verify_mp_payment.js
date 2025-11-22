// File: handlers/buttons/store_verify_mp_payment.js
const db = require('../../database.js');
const { getPaymentStatus } = require('../../utils/mercadoPago.js');
const { approvePurchase } = require('../../utils/approvePurchase.js');
const { EPHEMERAL_FLAG } = require('../../utils/constants.js');

module.exports = {
    customId: 'store_verify_mp_payment',
    async execute(interaction) {
        // Adia a resposta para evitar "Interação Falhou" enquanto consulta a API
        await interaction.deferReply({ ephemeral: true });

        try {
            const cartId = interaction.channel.id;
            
            // 1. Busca o Carrinho
            const cartResult = await db.query("SELECT * FROM store_carts WHERE channel_id = $1", [cartId]);
            const cart = cartResult.rows[0];

            if (!cart) {
                return interaction.editReply({ content: '❌ Carrinho não encontrado.' });
            }

            if (!cart.payment_id) {
                return interaction.editReply({ content: '⚠️ Nenhum pagamento identificado para este carrinho ainda. Gere o Pix primeiro.' });
            }

            // 2. Verifica Status na API do Mercado Pago
            console.log(`[MP Verify] Verificando ID: ${cart.payment_id} na Guild: ${interaction.guild.id}`);
            
            const paymentInfo = await getPaymentStatus(interaction.guild.id, cart.payment_id);

            if (!paymentInfo) {
                return interaction.editReply({ content: '❌ Não foi possível conectar ao Mercado Pago. Tente novamente em instantes.' });
            }

            const status = paymentInfo.status;
            const statusDetail = paymentInfo.status_detail;

            // 3. Lógica de Aprovação
            if (status === 'approved') {
                await interaction.editReply({ content: '✅ **Pagamento Aprovado!** Processando sua entrega...' });
                
                // Chama a função de entrega global
                try {
                    await approvePurchase(interaction.client, interaction.guild.id, cartId, interaction);
                    // approvePurchase cuida de deletar o carrinho ou avisar, então paramos aqui
                } catch (deliveryError) {
                    console.error('[MP Verify] Erro na entrega:', deliveryError);
                    await interaction.followUp({ content: '⚠️ Pagamento aprovado, mas houve um erro na entrega automática. A Staff foi notificada.', flags: EPHEMERAL_FLAG });
                }

            } else if (status === 'pending' || status === 'in_process') {
                return interaction.editReply({ content: '⏳ **Pagamento Pendente.**\nO banco ainda está processando seu Pix. Aguarde alguns segundos e clique em verificar novamente.' });
            
            } else if (status === 'rejected') {
                 return interaction.editReply({ content: `❌ **Pagamento Rejeitado.**\nMotivo: ${statusDetail || 'Desconhecido'}. Tente gerar um novo pagamento.` });
            
            } else {
                return interaction.editReply({ content: `ℹ️ Status atual: **${status}**. Clique novamente se já tiver pago.` });
            }

        } catch (error) {
            console.error('[MP Verify] Erro Crítico:', error);
            await interaction.editReply({ content: '❌ Ocorreu um erro interno ao verificar o pagamento.' });
        }
    }
};