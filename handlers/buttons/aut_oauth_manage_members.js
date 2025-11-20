// File: handlers/buttons/aut_oauth_manage_members.js
const axios = require('axios');
const { V2_FLAG } = require('../../utils/constants.js');

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
    
    // --- CORREÇÃO DE URL BLINDADA ---
    let authUrl = process.env.AUTH_SYSTEM_URL;
    
    // Se não tiver URL, erro
    if (!authUrl) return sendError(interaction, "A variável AUTH_SYSTEM_URL está vazia no .env do Bot.");

    // 1. Remove espaços
    authUrl = authUrl.trim();
    // 2. Remove a barra no final se tiver (https://site.app/ -> https://site.app)
    if (authUrl.endsWith('/')) authUrl = authUrl.slice(0, -1);
    // 3. Remove o caminho do callback se o usuário esqueceu de tirar
    authUrl = authUrl.replace('/auth/callback', '');

    // Monta a URL final da API (e imprime no console para você conferir)
    const apiUrl = `${authUrl}/api/users`;
    console.log(`[DEBUG] Buscando membros em: ${apiUrl}`);

    try {
        // Busca usuários na API
        const response = await axios.get(apiUrl, {
            params: { guild_id: guildId, page: page, limit: 5 }
        });

        const { users, total, totalPages } = response.data;

        // --- CONSTRUÇÃO DA INTERFACE V2 ---
        const components = [];

        // 1. Cabeçalho
        components.push({ "type": 10, "content": `## 👥 Gerenciamento de Membros` });
        components.push({ "type": 10, "content": `> **Total na Lista:** ${total} membros\n> **Status:** Conectado ao Banco de Dados.` });
        components.push({ "type": 14, "divider": true, "spacing": 2 });

        // 2. Lista de Usuários
        if (!users || users.length === 0) {
            components.push({ "type": 10, "content": "🔒 **Nenhum membro encontrado para este servidor.**\nCompartilhe a nova vitrine para os membros se registrarem." });
        } else {
            for (const user of users) {
                const isSelf = user.id === interaction.user.id;
                
                components.push({
                    "type": 9, 
                    "accessory": { 
                        "type": 2, 
                        "style": 1, 
                        "label": "Puxar (Join)", 
                        "emoji": { "name": "🚀" }, 
                        "custom_id": `oauth_transfer_${user.id}`,
                        "disabled": isSelf
                    },
                    "components": [
                        { "type": 10, "content": `### 👤 ${user.username}` },
                        { "type": 10, "content": `> **ID:** ${user.id}\n> **Origem:** ${user.origin_guild === guildId ? '✅ Este Servidor' : '⚠️ Link Antigo/Outro'}` }
                    ]
                });
                components.push({ "type": 14, "divider": true, "spacing": 1 });
            }
        }

        // 3. Paginação
        const paginationRow = {
            "type": 1,
            "components": [
                { "type": 2, "style": 2, "label": "Anterior", "custom_id": `oauth_page_${page - 1}`, "disabled": page <= 1 },
                { "type": 2, "style": 2, "label": `${page}/${totalPages || 1}`, "custom_id": "oauth_page_noop", "disabled": true },
                { "type": 2, "style": 2, "label": "Próximo", "custom_id": `oauth_page_${page + 1}`, "disabled": page >= (totalPages || 1) },
                { "type": 2, "style": 4, "label": "Voltar", "emoji": { "name": "⬅️" }, "custom_id": "aut_reg_open_oauth_hub" }
            ]
        };
        
        components.push(paginationRow);

        await interaction.editReply({ components: components, embeds: [], content: "" });

    } catch (error) {
        console.error('[Auth Error]', error.message);
        console.error('[Auth Error URL]', apiUrl); // Mostra qual URL falhou
        
        let msg = `Falha ao conectar na API (${apiUrl}).`;
        if (error.response?.status === 404) msg = `Rota não encontrada (404). O Bot tentou acessar: \`${apiUrl}\`\nVerifique se o Site (Backend) está rodando a versão mais recente.`;
        
        await sendError(interaction, msg);
    }
}

// Função auxiliar de erro V2
async function sendError(interaction, msg) {
    await interaction.editReply({
        content: "",
        embeds: [],
        components: [
            { "type": 10, "content": `### ❌ Erro de Conexão\n> ${msg}` },
            { "type": 1, "components": [{ "type": 2, "style": 2, "label": "Voltar", "emoji": { "name": "⬅️" }, "custom_id": "aut_reg_open_oauth_hub" }] }
        ]
    });
}

// Exportação crucial para a paginação funcionar
module.exports.loadMembersPage = loadMembersPage;