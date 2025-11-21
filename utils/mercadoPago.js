// File: utils/mercadoPago.js
const { MercadoPagoConfig, Payment } = require('mercadopago');
const db = require('../database.js');

async function getPaymentStatus(guildId, paymentId) {
    const settings = (await db.query('SELECT store_mp_token FROM guild_settings WHERE guild_id = $1', [guildId])).rows[0];
    if (!settings || !settings.store_mp_token) return null;

    const client = new MercadoPagoConfig({ accessToken: settings.store_mp_token });
    const payment = new Payment(client);
    return await payment.get({ id: paymentId });
}

async function createPixPayment(guildId, cart, products) {
    const settings = (await db.query('SELECT store_mp_token FROM guild_settings WHERE guild_id = $1', [guildId])).rows[0];
    
    if (!settings || !settings.store_mp_token) {
        throw new Error('Token do Mercado Pago não configurado na loja.');
    }

    const client = new MercadoPagoConfig({ accessToken: settings.store_mp_token });
    const payment = new Payment(client);

    const totalPrice = parseFloat(cart.total_price);
    if (isNaN(totalPrice) || totalPrice <= 0) throw new Error('Valor inválido.');

    // Previne descrição vazia
    const description = products.length > 0 
        ? `Pedido ${cart.channel_id} - ${products.map(p => p.name).slice(0, 3).join(', ')}`
        : `Pedido ${cart.channel_id}`;

    const body = {
        transaction_amount: totalPrice,
        description: description.substring(0, 250), // Limite do MP
        payment_method_id: 'pix',
        payer: {
            email: `cliente_${cart.user_id}@comunidade.discord`, // Email fake seguro
            first_name: `User ${cart.user_id}`
        },
        external_reference: cart.channel_id
    };

    const result = await payment.create({ body });
    
    // Salva o ID do pagamento no carrinho
    await db.query('UPDATE store_carts SET payment_id = $1, status = $2 WHERE channel_id = $3', 
        [result.id.toString(), 'payment', cart.channel_id]
    );

    return {
        paymentId: result.id,
        qrCode: result.point_of_interaction.transaction_data.qr_code_base64,
        qrCodeCopy: result.point_of_interaction.transaction_data.qr_code
    };
}

module.exports = { createPixPayment, getPaymentStatus };