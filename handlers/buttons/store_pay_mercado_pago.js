// File: handlers/buttons/store_pay_mercado_pago.js
const db = require('../../database.js');
const { createPixPayment } = require('../../utils/mercadoPago.js');
const { EPHEMERAL_FLAG } = require('../../utils/constants.js');

module.exports = {
    customId: 'store_pay_mercado_pago',
    async execute(interaction, guildSettings) {
        await interaction.deferReply({ ephemeral: true });

        try {
            // 1. Busca o carrinho do usuário
            const cartResult = await db.query(
                "SELECT * FROM store_carts WHERE channel_id = $1", 
                [interaction.channel.id]
            );
            const cart = cartResult.rows[0];

            if (!cart) {
                return interaction.editReply({ content: '❌ Carrinho não encontrado.' });
            }

            if (!guildSettings.store_mp_token) {
                return interaction.editReply({ content: '❌ Erro de Configuração: O token do Mercado Pago não foi configurado neste servidor.' });
            }

            // 2. Gera o pagamento usando o utilitário
            // Envia o ID do canal como "external_reference" para sabermos qual carrinho aprovar depois
            const paymentData = await createPixPayment(
                cart.total_price, 
                guildSettings.store_mp_token, 
                `Pagamento Carrinho ${cart.channel_id}`, // Descrição
                cart.user_id, // Email (usamos ID fake no utils se necessário)
                interaction.user.username,
                interaction.channel.id // EXTERNAL REFERENCE (MUITO IMPORTANTE)
            );

            if (!paymentData) {
                return interaction.editReply({ content: '❌ Erro ao gerar cobrança no Mercado Pago. Verifique o Token.' });
            }

            // 3. Atualiza o carrinho com o ID do pagamento
            await db.query(
                "UPDATE store_carts SET status = 'payment', payment_id = $1 WHERE channel_id = $2",
                [paymentData.id.toString(), interaction.channel.id]
            );

            // 4. Envia o QR Code para o usuário (Base64 buffer)
            const buffer = Buffer.from(paymentData.qr_code_base64, 'base64');
            
            await interaction.editReply({
                content: `✅ **Cobrança Gerada!**\nValor: **R$ ${cart.total_price}**\n\n1. Abra seu App do Banco.\n2. Escolha **Pix Copia e Cola** ou **Ler QR Code**.\n3. O pagamento será aprovado automaticamente em alguns segundos.`,
                files: [{ attachment: buffer, name: 'pix_qrcode.png' }],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                style: 2,
                                label: "Copia e Cola (Código)",
                                custom_id: "store_copy_pix_code",
                                disabled: true // O código copia e cola geralmente é muito grande para botão/msg, a imagem é melhor. Se tiver o 'qr_code' texto, pode mandar na msg.
                            }
                        ]
                    }
                ]
            });
            
            // Opcional: Mandar o código Copia e Cola em texto separado para facilitar
            if (paymentData.qr_code) {
                await interaction.followUp({ content: `**Copia e Cola:**\n\`\`\`${paymentData.qr_code}\`\`\``, ephemeral: true });
            }

        } catch (error) {
            console.error('[MP Handler] Erro:', error);
            await interaction.editReply({ content: '❌ Ocorreu um erro interno ao processar o pagamento.' });
        }
    }
};