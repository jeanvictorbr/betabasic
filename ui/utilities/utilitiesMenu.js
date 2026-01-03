// File: ui/utilities/utilitiesMenu.js
// V2_FLAG = 1 << 15
const V2_FLAG = 32768; 

module.exports = () => {
    return {
        type: 17,
        body: {
            type: 1,
            flags: V2_FLAG,
            // ❌ REMOVIDO: content: "Texto...", pois causa o erro na V2
            components: [
                // ✅ ADICIONADO: Componente de Texto (Type 10)
                {
                    type: 10,
                    content: "🛠️ **Central de Utilidades**\n\nFerramentas práticas para facilitar a gestão do seu servidor. Escolha uma opção:"
                },
                // Seus botões originais
                {
                    type: 1, // Action Row
                    components: [
                        {
                            type: 2, // Button
                            style: 1, // Primary (Blurple)
                            label: "Criador de Containers (Builder)",
                            emoji: { name: "🎨" },
                            custom_id: "util_eb_start"
                        },
                        {
                            type: 2, // Button
                            style: 2, // Secondary (Grey)
                            label: "Voltar",
                            emoji: { name: "⬅️" },
                            custom_id: "main_menu_back"
                        }
                    ]
                }
            ]
        }
    };
};