const { EmbedBuilder } = require('discord.js');
const database = require('../../database');
const devGuildManageMenu = require('../../ui/devPanel/devGuildManageMenu');

// Mapeamento de nomes técnicos do DB para nomes bonitos
const MODULE_NAMES = {
    'tickets_system': '🎫 Tickets',
    'welcome_system': '👋 Boas-vindas',
    'goodbye_system': '🚪 Saída',
    'store_system': '🛒 Loja/Vendas',
    'moderation_system': '🛡️ Moderação',
    'automations_system': '🤖 Automações',
    'ranking_system': '🏆 Ranking/XP',
    'suggestion_system': '💡 Sugestões',
    'roletags_system': '🏷️ RoleTags',
    'guardian_system': '🚨 Guardian (Anti-Raid)',
    'voice_system': '🔊 Voz Temporária',
    'giveaway_system': '🎉 Sorteios'
};

module.exports = {
    customId: 'dev_guild_manage_select', // Este handler pega o evento do menu de seleção
    run: async (client, interaction) => {
        try {
            // O valor selecionado no menu é o ID da guilda
            const guildId = interaction.values[0];
            const guild = client.guilds.cache.get(guildId);

            // Se a guilda não estiver no cache (bot foi removido ou erro de sync)
            if (!guild) {
                return interaction.reply({
                    content: `❌ **Erro:** Não consegui encontrar a guilda \`${guildId}\` no cache do bot. Ela pode ter sido deletada ou o bot foi removido.`,
                    ephemeral: true
                });
            }

            await interaction.deferUpdate();

            // 1. Buscando dados do Banco de Dados
            const db = await database.getClient();
            let guildModules = {};
            let guildSettings = {};
            let ownerName = 'Desconhecido';

            try {
                // Busca módulos ativos
                const modulesRes = await db.query("SELECT * FROM guild_modules WHERE guild_id = $1", [guildId]);
                if (modulesRes.rows.length > 0) guildModules = modulesRes.rows[0];

                // Busca configurações gerais (para ver prefixo, idioma, etc - opcional)
                const settingsRes = await db.query("SELECT * FROM guild_settings WHERE guild_id = $1", [guildId]);
                if (settingsRes.rows.length > 0) guildSettings = settingsRes.rows[0];

            } catch (err) {
                console.error("Erro ao buscar dados da guilda no DevPanel:", err);
            } finally {
                db.release();
            }

            // 2. Tenta buscar o Dono (pode falhar se o dono saiu, etc)
            try {
                const owner = await guild.fetchOwner();
                ownerName = `${owner.user.username} (${owner.id})`;
            } catch (e) {
                ownerName = `⚠️ Não encontrado (ID: ${guild.ownerId})`;
            }

            // 3. Processar Módulos Ativos
            const activeModulesList = [];
            for (const [key, value] of Object.entries(guildModules)) {
                // Pula colunas que não são booleanas ou de controle
                if (value === true && MODULE_NAMES[key]) {
                    activeModulesList.push(MODULE_NAMES[key]);
                }
            }

            // 4. Análise de "Saúde" da Guilda (Para ajudar na faxina)
            let healthStatus = "🟢 Saudável";
            const daysSinceJoin = Math.floor((Date.now() - guild.joinedTimestamp) / (1000 * 60 * 60 * 24));
            
            if (activeModulesList.length === 0 && daysSinceJoin > 7) {
                healthStatus = "🔴 **INATIVA / FANTASMA** (Sem uso)";
            } else if (activeModulesList.length === 0) {
                healthStatus = "🟡 Configuração Pendente";
            } else if (guild.memberCount < 3 && daysSinceJoin > 30) {
                healthStatus = "🟠 **ABANDONADA** (< 3 membros)";
            }

            // Chama a UI com todos os dados processados
            const uiResponse = devGuildManageMenu(guild, {
                ownerName,
                activeModulesList,
                guildSettings,
                joinedDays: daysSinceJoin,
                healthStatus
            });

            await interaction.editReply(uiResponse);

        } catch (error) {
            console.error('[DevPanel Error]', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Ocorreu um erro ao carregar os dados da guilda.', ephemeral: true });
            }
        }
    }
};