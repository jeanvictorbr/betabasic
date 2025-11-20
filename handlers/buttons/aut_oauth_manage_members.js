// File: handlers/buttons/aut_oauth_manage_members.js
const axios = require('axios');
const { PermissionsBitField } = require('discord.js');

// Configure seu ID aqui para ver o botão global
const DEVELOPER_ID = process.env.OWNER_ID || '140867979578576916'; 

module.exports = {
    customId: 'aut_oauth_manage_members',
    async execute(interaction) {
        await loadMembersPage(interaction, 1, false);
    }
};

async function loadMembersPage(interaction, page, isGlobal = false) {
    // Garante que a interação não expire
    if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();

    const guildId = interaction.guild.id;
    let authUrl = process.env.AUTH_SYSTEM_URL;

    // Função Segura de Erro (V2 Compatible)
    const sendError = async (msg) => {
        await interaction.editReply({
            content: "", 
            embeds: [],
            components: [
                { "type": 10, "content": `### ❌ Erro\n> ${msg}` },
                { "type": 1, "components": [{ "type": 2, "style": 2, "label": "Voltar", "emoji": { "name": "⬅️" }, "custom_id": "aut_reg_open_oauth_hub" }] }
            ]
        });
    };

    if (!authUrl) return sendError("URL do Auth System não configurada no .env");

    // Limpeza de URL
    authUrl = authUrl.trim().replace(/\/$/, '').replace('/auth/callback', '');
    const apiUrl = `${authUrl}/api/users`;

    try {
        const params = { 
            page: page, 
            limit: 5,
            ...(isGlobal ? { all: 'true' } : { guild_id: guildId })
        };

        const response = await axios.get(apiUrl, { params });
        const { users, total, totalPages } = response.data;

        const components = [];
        const title = isGlobal ? "🌍 Painel Global (Developer)" : "👥 Gerenciamento Local";

        // 1. Cabeçalho
        components.push({ "type": 10, "content": `## ${title}` });
        components.push({ "type": 10, "content": `> **Total:** ${total} membros | **Página:** ${page}/${totalPages || 1}` });
        components.push({ "type": 14, "divider": true, "spacing": 2 });

        // 2. Botões de Ação (Topo)
        const actionButtons = [];
        
        if (!isGlobal) {
            actionButtons.push({ 
                "type": 2, "style": 3, // Green
                "label": "Transferir em Massa", "emoji": { "name": "📦" }, 
                "custom_id": "aut_oauth_mass_transfer_start" 
            });
        }

        // Permissão para ver Global
        if (interaction.user.id === DEVELOPER_ID || interaction.user.id === interaction.guild.ownerId) {
            if (!isGlobal) {
                actionButtons.push({ "type": 2, "style": 4, "label": "Ver Lista Global", "emoji": { "name": "🌎" }, "custom_id": "aut_oauth_global_view" });
            } else {
                actionButtons.push({ "type": 2, "style": 2, "label": "Voltar para Local", "emoji": { "name": "🏠" }, "custom_id": "aut_oauth_manage_members" });
                // Botão de Massa Global
                actionButtons.push({ "type": 2, "style": 3, "label": "Transferir Global", "emoji": { "name": "📦" }, "custom_id": "aut_oauth_mass_transfer_global_start" });
            }
        }

        if (actionButtons.length > 0) {
            components.push({ "type": 1, "components": actionButtons });
            components.push({ "type": 14, "divider": true, "spacing": 1 });
        }

        // 3. Lista de Usuários
        if (!users || users.length === 0) {
            components.push({ "type": 10, "content": "🔒 **Nenhum usuário encontrado.**" });
        } else {
            for (const user of users) {
                let originText = '⚠️ Link Antigo/Outro';
                if (user.origin_guild === guildId) originText = '✅ Este Servidor';
                if (isGlobal) originText = `🆔 Server: ${user.origin_guild?.substring(0, 18) || '?'}`;

                // Bloco do Usuário (Texto)
                components.push({
                    "type": 9, // Container V2
                    "components": [
                        { "type": 10, "content": `### 👤 ${user.username}` },
                        { "type": 10, "content": `> **ID:** ${user.id} • ${originText}` }
                    ]
                });

                // Bloco de Ações do Usuário (Botões)
                components.push({
                    "type": 1, // Action Row
                    "components": [
                        // Botão 1: Puxar (Abre Modal de Destino)
                        { 
                            "type": 2, 
                            "style": 1, // Blurple
                            "label": "Puxar", 
                            "emoji": { "name": "🚀" }, 
                            "custom_id": `oauth_ask_${user.id}` 
                        },
                        // Botão 2: Remover (Apaga do Banco)
                        { 
                            "type": 2, 
                            "style": 4, // Red/Destructive
                            "label": "Remover", 
                            "emoji": { "name": "🗑️" }, 
                            "custom_id": `oauth_remove_${user.id}` 
                        }
                    ]
                });

                components.push({ "type": 14, "divider": true, "spacing": 1 });
            }
        }

        // 4. Paginação
        const modePrefix = isGlobal ? 'oauth_global_page_' : 'oauth_page_';
        
        components.push({
            "type": 1,
            "components": [
                { "type": 2, "style": 2, "label": "◀", "custom_id": `${modePrefix}${page - 1}`, "disabled": page <= 1 },
                { "type": 2, "style": 2, "label": `${page}/${totalPages || 1}`, "custom_id": "noop", "disabled": true },
                { "type": 2, "style": 2, "label": "▶", "custom_id": `${modePrefix}${page + 1}`, "disabled": page >= (totalPages || 1) },
                { "type": 2, "style": 2, "label": "Voltar", "emoji": { "name": "⬅️" }, "custom_id": "aut_reg_open_oauth_hub" }
            ]
        });

        // Envia tudo limpo (sem embeds ou content antigos)
        await interaction.editReply({ components: components, embeds: [], content: "" });

    } catch (error) {
        console.error('[Manage Members Error]', error);
        let msg = "Erro ao carregar lista. Tente novamente.";
        if (error.response) msg = `Erro da API: ${error.response.status} - ${error.response.statusText}`;
        await sendError(msg);
    }
}

module.exports.loadMembersPage = loadMembersPage;