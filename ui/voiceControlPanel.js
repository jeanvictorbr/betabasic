module.exports = (data) => {
    // data espera: { channelName, ownerId, isLocked, isHidden, userLimit, channelId }
    
    const statusText = `## 🎛️ Painel de Controle: ${data.channelName}\n👑 **Dono:** <@${data.ownerId}>`;

    const statusDetails = `
🔒 **Estado:** ${data.isLocked ? "Trancado (Privado)" : "Aberto (Público)"}
👁️ **Visibilidade:** ${data.isHidden ? "Oculto" : "Visível"}
👥 **Limite:** ${data.userLimit === 0 ? "Sem limite" : `${data.userLimit} usuários`}
    `.trim();

    return {
        type: 17, // Container V2
        components: [
            {
                type: 10, // Text Display (Título)
                content: statusText,
                style: 1
            },
            {
                type: 9, // Section (Detalhes)
                components: [
                    {
                        type: 10,
                        content: statusDetails
                    }
                ]
            },
            {
                type: 1, // Action Row (Botões)
                components: [
                    {
                        type: 2, // Button
                        style: data.isLocked ? 3 : 4, // 3=Verde, 4=Vermelho
                        label: data.isLocked ? "Destrancar" : "Trancar",
                        custom_id: `voice_toggle_lock_${data.channelId}`,
                        emoji: { name: data.isLocked ? "unlock" : "lock" }
                    },
                    {
                        type: 2,
                        style: 2, // Secondary (Cinza)
                        label: data.isHidden ? "Mostrar" : "Ocultar",
                        custom_id: `voice_toggle_hide_${data.channelId}`,
                        emoji: { name: data.isHidden ? "eye" : "eye_slash" }
                    },
                    {
                        type: 2,
                        style: 1, // Primary (Roxo)
                        label: "Renomear",
                        custom_id: `voice_rename_modal_${data.channelId}`,
                        emoji: { name: "pencil" }
                    },
                    {
                        type: 2,
                        style: 2,
                        label: "Kick",
                        custom_id: `voice_kick_menu_${data.channelId}`,
                        emoji: { name: "user_times" }
                    }
                ]
            }
        ]
    };
};