const { MercadoPagoConfig, Payment } = require('mercadopago');
const db = require('../database.js');

/**
 * Busca o status de um pagamento específico.
 * @param {string} guildId ID do servidor (para buscar o token).
 * @param {string} paymentId ID do pagamento no Mercado Pago.
 */
async function getPaymentStatus(guildId, paymentId) {
    const settings = (await db.query('SELECT store_mp_token FROM guild_settings WHERE guild_id = $1', [guildId])).rows[0];
    if (!settings || !settings.store_mp_token) {
        console.warn('[Mercado Pago] Token não configurado ao tentar buscar status.');
        return null;
    }

    const client = new MercadoPagoConfig({ accessToken: settings.store_mp_token });
    const payment = new Payment(client);

    try {
        const paymentInfo = await payment.get({ id: paymentId });
        return paymentInfo;
    } catch (error) {
        console.error(`[Mercado Pago] Erro ao buscar status do pagamento ${paymentId}:`, error.message);
        return null;
    }
}

/**
 * Cria um pagamento PIX.
 * @param {string} guildId ID do servidor.
 * @param {object} cart Objeto do carrinho (do banco de dados).
 * @param {array} products Array de produtos.
 */
async function createPixPayment(guildId, cart, products) {
    console.log(`[MP Debug] Iniciando criação de PIX. Guild: ${guildId}, Cart: ${cart.channel_id}`);

    const settings = (await db.query('SELECT store_mp_token FROM guild_settings WHERE guild_id = $1', [guildId])).rows[0];
    
    if (!settings || !settings.store_mp_token) {
        throw new Error('O token de acesso do Mercado Pago não está configurado.');
    }

    const client = new MercadoPagoConfig({ accessToken: settings.store_mp_token });
    const payment = new Payment(client);

    // --- CORREÇÃO DO VALOR (CRÍTICO) ---
    // Garante que "10,00" vire "10.00" e depois um número 10.00
    let priceString = String(cart.total_price).replace(',', '.');
    const totalPrice = parseFloat(priceString);

    console.log(`[MP Debug] Preço Bruto: ${cart.total_price} | Preço Processado: ${totalPrice}`);

    if (isNaN(totalPrice) || totalPrice <= 0) {
        throw new Error(`O valor total da compra é inválido (R$ ${cart.total_price}). Verifique o preço dos produtos.`);
    }

    // Monta a descrição (limitada a 250 caracteres para evitar erro da API)
    const productNames = products.map(p => p.name).join(', ');
    const description = `Pedido ${cart.channel_id} - ${productNames}`.substring(0, 250);

    const body = {
        transaction_amount: totalPrice,
        description: description,
        payment_method_id: 'pix',
        payer: {
            // Email fake obrigatório para a API aceitar (não afeta o usuário)
            email: `cliente_${cart.user_id}@comunidade.discord`,
            first_name: `User ${cart.user_id}`
        },
        external_reference: cart.channel_id // Importante para o Webhook identificar a compra
    };

    try {
        const result = await payment.create({ body });
        
        if (!result || !result.id) {
            throw new Error('A API do Mercado Pago não retornou um ID válido.');
        }

        // Salva o ID do pagamento no carrinho para conferência futura
        await db.query(
            'UPDATE store_carts SET payment_id = $1, status = $2 WHERE channel_id = $3', 
            [result.id.toString(), 'payment', cart.channel_id]
        );

        return {
            paymentId: result.id,
            qrCode: result.point_of_interaction.transaction_data.qr_code_base64, // Imagem
            qrCodeCopy: result.point_of_interaction.transaction_data.qr_code      // Texto Copia e Cola
        };

    } catch (error) {
        console.error('[Mercado Pago] Erro Fatal na API:', error);
        // Tenta pegar a mensagem de erro real da API se disponível
        const apiMsg = error.cause?.description || error.message;
        throw new Error(`Falha no Mercado Pago: ${apiMsg}`);
    }
}

module.exports = { createPixPayment, getPaymentStatus };