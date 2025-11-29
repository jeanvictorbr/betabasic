const { EmbedBuilder } = require('discord.js');
const database = require('../../database');
const devGuildManageMenu = require('../../ui/devPanel/devGuildManageMenu');

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
    customId: 'dev_guild_manage_select',
    run: async (client, interaction) => {
        try {
            const guildId = interaction.values[0];
            
            // Verificação de segurança: Opção "none" ou inválida
            if (!guildId || guildId === 'none') {
                return interaction.deferUpdate(); // Só ignora
            }

            const guild = client.guilds.cache.get(guildId);

            if (!guild) {
                return interaction.reply({
                    content: `❌ **Erro:** A guilda \`${guildId}\` não está mais no cache (Bot removido?).`,
                    ephemeral: true
                });
            }

            await interaction.deferUpdate();

            // 1. Buscando dados
            const db = await database.getClient();
            let guildModules = {};
            let guildSettings = {};
            let ownerName = 'Desconhecido';

            try {
                const modulesRes = await db.query("SELECT * FROM guild_modules WHERE guild_id = $1", [guildId]);
                if (modulesRes.rows.length > 0) guildModules = modulesRes.rows[0];

                const settingsRes = await db.query("SELECT * FROM guild_settings WHERE guild_id = $1", [guildId]);
                if (settingsRes.rows.length > 0) guildSettings = settingsRes.rows[0];

            } catch (err) {
                console.error("Erro DB DevPanel:", err);
            } finally {
                db.release();
            }

            try {
                const owner = await guild.fetchOwner();
                ownerName = `${owner.user.username} (${owner.id})`;
            } catch (e) {
                ownerName = `⚠️ Não encontrado (ID: ${guild.ownerId})`;
            }

            // 2. Processamento
            const activeModulesList = [];
            for (const [key, value] of Object.entries(guildModules)) {
                if (value === true && MODULE_NAMES[key]) {
                    activeModulesList.push(MODULE_NAMES[key]);
                }
            }

            let healthStatus = "🟢 Saudável";
            const daysSinceJoin = Math.floor((Date.now() - guild.joinedTimestamp) / (1000 * 60 * 60 * 24));
            
            if (activeModulesList.length === 0 && daysSinceJoin > 7) {
                healthStatus = "🔴 **INATIVA / FANTASMA** (Sem uso)";
            } else if (activeModulesList.length === 0) {
                healthStatus = "🟡 Configuração Pendente";
            } else if (guild.memberCount < 3 && daysSinceJoin > 30) {
                healthStatus = "🟠 **ABANDONADA** (< 3 membros)";
            }

            // 3. Resposta com UI Corrigida
            const uiResponse = devGuildManageMenu(guild, {
                ownerName,
                activeModulesList,
                guildSettings,
                joinedDays: daysSinceJoin,
                healthStatus
            });

            // CORREÇÃO: Usando .body
            await interaction.editReply(uiResponse.body);

        } catch (error) {
            console.error('[DevPanel Error]', error);
            if (!interaction.replied) {
                await interaction.followUp({ content: 'Ocorreu um erro ao carregar os dados.', ephemeral: true });
            }
        }
    }
};