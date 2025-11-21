// File: ui/store/paymentMenu.js
// CORRIGIDO: Adicionado o botão de Mercado Pago (Pix Automático)

module.exports = function generatePaymentMenu(cart, settings) {
    const components = [];
    
    // Verifica se há um token configurado (mesmo que seja teste)
    const hasMpToken = !!settings.store_mp_token; 
    // Verifica se há chave pix manual
    const hasPixKey = !!settings.store_pix_key;

    // Seção de Resumo
    components.push({
        type: 10,
        content: `## 🛒 Caixa - Pagamento\n> **Total a Pagar:** R$ ${cart.total_price}\n> Escolha sua forma de pagamento abaixo.`
    });

    const paymentButtons = [];

    // --- LÓGICA DO BOTAO MP ---
    if (hasMpToken) {
        paymentButtons.push({
            type: 2,
            style: 3, // Success (Verde)
            label: "Pagar com Pix (Automático)",
            emoji: { name: "💠" },
            custom_id: "store_pay_mercado_pago" // Este ID chama o handler que gera o QR Code
        });
    } else {
        // Opcional: Mostrar aviso se não houver método
        // paymentButtons.push({ type: 2, style: 2, label: "Pix Automático (Indisponível)", disabled: true, custom_id: "disabled_mp" });
    }

    if (hasPixKey) {
        paymentButtons.push({
            type: 2,
            style: 1, // Primary (Azul)
            label: "Pix Manual (Comprovante)",
            emoji: { name: "📄" },
            custom_id: "store_pay_manual"
        });
    }

    // Botão de Cancelar sempre presente
    paymentButtons.push({
        type: 2,
        style: 4, // Danger (Vermelho)
        label: "Cancelar Compra",
        custom_id: "store_cart_cancel"
    });

    // Adiciona a linha de botões
    components.push({
        type: 1,
        components: paymentButtons
    });

    // Adiciona botão de voltar
    components.push({
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
    });

    return [
        {
            type: 17, 
            components: components
        }
    ];
};