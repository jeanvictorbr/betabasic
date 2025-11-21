// File: ui/store/paymentMenu.js
module.exports = function generatePaymentMenu(cart, settings, coupon, guild) {
    
    // Verificações simples
    const hasMpToken = !!settings.store_mp_token;
    const hasPixKey = !!settings.store_pix_key;
    const totalPrice = cart.total_price;

    // Construção da Lista de Botões
    const paymentButtons = [];

    if (hasMpToken) {
        paymentButtons.push({
            type: 2,
            style: 3, // Verde
            label: "Pagar com Pix Automático",
            emoji: { name: "💠" },
            custom_id: "store_pay_mercado_pago"
        });
    }

    if (hasPixKey) {
        paymentButtons.push({
            type: 2,
            style: 1, // Azul
            label: "Pix Manual (Enviar Comprovante)",
            emoji: { name: "📄" },
            custom_id: "store_pay_manual"
        });
    }

    // Botão de Cancelar sempre existe
    paymentButtons.push({
        type: 2,
        style: 4, // Vermelho
        label: "Cancelar Compra",
        custom_id: "store_cart_cancel"
    });

    // Retorno no padrão V2 ESTRITO (Array de Objetos)
    return [
        {
            type: 17,
            components: [
                {
                    type: 10,
                    content: `## 🛒 Finalizar Compra\nConfira os valores e escolha como pagar.\n\n> 📦 **Produtos:** ${cart.products_json ? cart.products_json.length : 0} item(ns)\n> 🏷️ **Cupom:** ${coupon ? coupon.code : 'Nenhum'}\n> 💰 **TOTAL A PAGAR:** **R$ ${totalPrice}**`
                },
                { type: 14, divider: true, spacing: 2 },
                {
                    type: 1,
                    components: paymentButtons.length > 0 ? paymentButtons : [{ type: 2, style: 2, label: "Nenhum método configurado", disabled: true, custom_id: "no_method" }]
                },
                { type: 14, divider: true, spacing: 1 },
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 2,
                            label: "Voltar ao Carrinho",
                            emoji: { name: "↩️" },
                            custom_id: "store_payment_return_to_cart"
                        }
                    ]
                }
            ]
        }
    ];
};