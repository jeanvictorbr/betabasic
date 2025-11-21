// File: handlers/buttons/store_pay_mercado_pago.js
const { createPixPayment } = require('../../utils/mercadoPago.js');
const db = require('../../database.js');
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    customId: 'store_pay_mercado_pago',
    async execute(interaction) {
        // Usa deferReply EPHEMERAL para gerar o QR Code sem fechar o menu
        await interaction.deferReply({ ephemeral: true });

        const cartId = interaction.channel.id;
        const cart = (await db.query('SELECT * FROM store_carts WHERE channel_id = $1', [cartId])).rows[0];
        
        if (!cart) return interaction.editReply("❌ Carrinho não encontrado.");

        const products = cart.products_json || [];

        try {
            // Chama a função do utils/mercadoPago.js
            const paymentData = await createPixPayment(interaction.guild.id, cart, products);
            
            const qrCodeBuffer = Buffer.from(paymentData.qrCode, 'base64');
            const attachmentName = `qrcode-pix.png`;

            const embed = new EmbedBuilder()
                .setColor('#2ECC71') // Verde Mercado Pago
                .setTitle('💠 Pagamento Pix Gerado!')
                .setDescription(`**Valor:** R$ ${cart.total_price}\n\n1️⃣ Abra o app do seu banco.\n2️⃣ Escolha **Pix** > **Ler QR Code**.\n3️⃣ Aponte a câmera ou use o código abaixo.`)
                .addFields(
                    { name: '👇 Pix Copia e Cola', value: `\`\`\`${paymentData.qrCodeCopy}\`\`\`` }
                )
                .setImage(`attachment://${attachmentName}`)
                .setFooter({ text: `ID do Pagamento: ${paymentData.paymentId}` })
                .setTimestamp();
                
            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`store_verify_mp_payment`) // Handler de verificação
                    .setLabel('Já paguei! Verificar')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✔️')
            );
            
            await interaction.editReply({
                embeds: [embed],
                components: [actionRow],
                files: [{ attachment: qrCodeBuffer, name: attachmentName }]
            });

        } catch (error) {
            console.error('[Store] Erro MP:', error);
            await interaction.editReply({ 
                content: `❌ **Erro ao gerar Pix:** ${error.message || 'Verifique se o Token MP é válido no painel avançado.'}`
            });
        }
    }
};