// File: ui/utilities/utilitiesMenu.js
const { V2_FLAG } = require('../../utils/constants');

module.exports = () => {
    return {
        type: 17,
        body: {
            type: 1,
            flags: V2_FLAG,
            content: "🛠️ **Central de Utilidades**\n\nFerramentas práticas para facilitar a gestão do seu servidor. Escolha uma opção:",
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 1, // Primary
                            label: "Criador de Embeds (Builder)",
                            emoji: { name: "🎨" },
                            custom_id: "util_eb_start"
                        },
                        {
                            type: 2,
                            style: 2,
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