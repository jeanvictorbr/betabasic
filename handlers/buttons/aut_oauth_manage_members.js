// File: handlers/buttons/aut_oauth_manage_members.js
const axios = require('axios');

const DEVELOPER_ID = process.env.OWNER_ID || '140867979578576916';

module.exports = {
    customId: 'aut_oauth_manage_members',
    async execute(interaction) {
        await loadMembersPage(interaction, 1, false);
    }
};

async function loadMembersPage(interaction, page, isGlobal = false) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();

    const guildId = interaction.guild.id;
    let authUrl = process.env.AUTH_SYSTEM_URL.trim().replace(/\/$/, '').replace('/auth/callback', '');
    
    try {
        const response = await axios.get(`${authUrl}/api/users`, {
            params: { page, limit: 5, ...(isGlobal ? { all: 'true' } : { guild_id: guildId }) }
        });
        const { users, total, totalPages } = response.data;

        const components = [];
        const title = isGlobal ? "🌍 Painel Global (Developer)" : "👥 Gerenciamento Local";

        components.push({ "type": 10, "content": `## ${title}` });
        components.push({ "type": 10, "content": `> **Total:** ${total} membros verificados` });
        components.push({ "type": 14, "divider": true, "spacing": 2 });

        // Ações do Painel
        const actionButtons = [];
        if (!isGlobal) {
            actionButtons.push({ "type": 2, "style": 3, "label": "Transferir em Massa", "emoji": { "name": "📦" }, "custom_id": "aut_oauth_mass_transfer_start" });
        }
        if (interaction.user.id === DEVELOPER_ID || interaction.user.id === interaction.guild.ownerId) {
            if (!isGlobal) actionButtons.push({ "type": 2, "style": 4, "label": "Ver Lista Global", "emoji": { "name": "🌎" }, "custom_id": "aut_oauth_global_view" });
            else {
                actionButtons.push({ "type": 2, "style": 3, "label": "Transferir Global", "emoji": { "name": "📦" }, "custom_id": "aut_oauth_mass_transfer_global_start" });
                actionButtons.push({ "type": 2, "style": 2, "label": "Voltar Local", "emoji": { "name": "🏠" }, "custom_id": "aut_oauth_manage_members" });
            }
        }
        if(actionButtons.length > 0) components.push({ "type": 1, "components": actionButtons });
        components.push({ "type": 14, "divider": true, "spacing": 1 });

        // LISTA DE USUÁRIOS
        if (!users || users.length === 0) {
            components.push({ "type": 10, "content": "🔒 **Nenhum usuário encontrado.**" });
        } else {
            for (const user of users) {
                let originInfo = user.origin_guild === guildId ? '✅ Local' : (isGlobal ? `🆔 ${user.origin_guild?.slice(0,15)}...` : '⚠️ Outro');
                
                // Bloco de Texto (Nome e ID)
                components.push({
                    "type": 9, // Container
                    "components": [
                        { "type": 10, "content": `### 👤 ${user.username}` }, 
                        { "type": 10, "content": `> **ID:** ${user.id} • ${originInfo}` }
                    ]
                });
                
                // Bloco de Botões (Puxar e Remover)
                components.push({
                    "type": 1, // ActionRow com os 2 botões
                    "components": [
                        { "type": 2, "style": 1, "label": "Puxar", "emoji": { "name": "🚀" }, "custom_id": `oauth_ask_${user.id}` },
                        { "type": 2, "style": 4, "label": "Remover Verif.", "emoji": { "name": "🗑️" }, "custom_id": `oauth_remove_${user.id}` }
                    ]
                });

                components.push({ "type": 14, "divider": true, "spacing": 1 });
            }
        }

        // Paginação
        const modePrefix = isGlobal ? 'oauth_global_page_' : 'oauth_page_';
        components.push({
            "type": 1,
            "components": [
                { "type": 2, "style": 2, "label": "◀", "custom_id": `${modePrefix}${page - 1}`, "disabled": page <= 1 },
                { "type": 2, "style": 2, "label": "▶", "custom_id": `${modePrefix}${page + 1}`, "disabled": page >= totalPages },
                { "type": 2, "style": 2, "label": "Voltar", "emoji": { "name": "⬅️" }, "custom_id": "aut_reg_open_oauth_hub" }
            ]
        });

        await interaction.editReply({ components: components, embeds: [], content: "" });

    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: "❌ Erro de conexão API.", components: [] });
    }
}

module.exports.loadMembersPage = loadMembersPage;