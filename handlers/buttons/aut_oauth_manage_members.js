// File: handlers/buttons/aut_oauth_manage_members.js
const axios = require('axios');
const { V2_FLAG, EPHEMERAL_FLAG } = require('../../utils/constants.js'); // Certifique-se que constants tem V2_FLAG

module.exports = {
    customId: 'aut_oauth_manage_members',
    async execute(interaction) {
        await loadMembersPage(interaction, 1);
    }
};

async function loadMembersPage(interaction, page) {
    // Se ainda não respondeu, defere a atualização
    if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();

    const guildId = interaction.guild.id;
    const authUrl = process.env.AUTH_SYSTEM_URL;
    
    // Função para gerar erro no formato V2 (Obrigatório usar Type 10 para texto)
    const sendError = async (msg) => {
        await interaction.editReply({
            content: "", // Limpa conteúdo legado se houver
            embeds: [],  // Limpa embeds
            components: [
                { "type": 10, "content": `### ❌ Erro\n> ${msg}` },
                { "type": 1, "components": [{ "type": 2, "style": 2, "label": "Voltar", "emoji": { "name": "⬅️" }, "custom_id": "aut_reg_open_oauth_hub" }] }
            ]
        });
    };

    if (!authUrl) return sendError("URL do Auth System não configurada no .env");

    try {
        // Busca usuários na API (Corrigida a URL base)
        const response = await axios.get(`${authUrl}/api/users`, {
            params: { guild_id: guildId, page: page, limit: 5 } // Limit reduzido para caber na tela V2
        });

        const { users, total, totalPages } = response.data;

        // --- CONSTRUÇÃO DA INTERFACE V2 ---
        const components = [];

        // 1. Cabeçalho
        components.push({ "type": 10, "content": `## 👥 Gerenciamento de Membros` });
        components.push({ "type": 10, "content": `> **Total Verificado:** ${total} membros\n> Selecione 'Puxar' para forçar a entrada do membro no servidor.` });
        components.push({ "type": 14, "divider": true, "spacing": 2 });

        // 2. Lista de Usuários
        if (users.length === 0) {
            components.push({ "type": 10, "content": "🔒 **Nenhum membro encontrado.**\nCompartilhe o link da vitrine para os membros se verificarem." });
        } else {
            for (const user of users) {
                // Filtra o próprio usuário para evitar transferir a si mesmo (opcional)
                const isSelf = user.id === interaction.user.id;
                
                components.push({
                    "type": 9, // Container V2
                    "accessory": { 
                        "type": 2, 
                        "style": 1, // Blurple
                        "label": "Puxar (Join)", 
                        "emoji": { "name": "🚀" }, 
                        "custom_id": `oauth_transfer_${user.id}`,
                        "disabled": isSelf
                    },
                    "components": [
                        { "type": 10, "content": `### 👤 ${user.username}` },
                        { "type": 10, "content": `> **ID:** ${user.id}\n> **Data:** ${new Date(user.updated_at).toLocaleDateString('pt-BR')}` }
                    ]
                });
                components.push({ "type": 14, "divider": true, "spacing": 1 });
            }
        }

        // 3. Paginação (Usando ActionRow padrão Type 1 no final)
        const paginationRow = {
            "type": 1,
            "components": [
                { "type": 2, "style": 2, "label": "Anterior", "custom_id": `oauth_page_${page - 1}`, "disabled": page <= 1 },
                { "type": 2, "style": 2, "label": `${page}/${totalPages || 1}`, "custom_id": "oauth_page_noop", "disabled": true },
                { "type": 2, "style": 2, "label": "Próximo", "custom_id": `oauth_page_${page + 1}`, "disabled": page >= totalPages },
                { "type": 2, "style": 4, "label": "Voltar", "emoji": { "name": "⬅️" }, "custom_id": "aut_reg_open_oauth_hub" } // Style 4 = Red/Destructive or use 2 for Gray
            ]
        };
        
        components.push(paginationRow);

        // ENVIA A RESPOSTA FORMATADA
        await interaction.editReply({
            components: components
        });

    } catch (error) {
        console.error('[Auth Error]', error.message);
        let msg = "Falha ao conectar na API.";
        if (error.response?.status === 404) msg = "Rota da API não encontrada (Verifique o link no .env).";
        if (error.code === 'ECONNREFUSED') msg = "O sistema de Auth parece estar offline.";
        
        await sendError(msg);
    }
}
module.exports.loadMembersPage = loadMembersPage;