// handlers/buttons/dev_guild_manage_select.js
const db = require('../../database.js');
const generateDevGuildManageMenu = require('../../ui/devPanel/devGuildManageMenu.js');

const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;
const STORE_GUILD_ID = '1424757317701996544'; // Seu Servidor da Loja

module.exports = {
    customId: 'dev_guild_manage_select', // Este ID pode variar se for dinâmico (ex: dev_guild_manage_select_), ajuste conforme seu arquivo original
    async execute(interaction) {
        // Se for um menu de seleção, o ID vem em values[0], se for botão, pode vir no customId split
        let guildId = interaction.values ? interaction.values[0] : null;
        
        // Fallback para caso o ID venha no botão (ex: dev_guild_manage_GWID)
        if (!guildId) {
            const parts = interaction.customId.split('_');
            guildId = parts[parts.length - 1];
        }

        if (!guildId) return interaction.reply({ content: '❌ ID da guilda não encontrado.', flags: EPHEMERAL_FLAG });

        await interaction.deferUpdate();

        try {
            // 1. Busca dados da Guilda e Configurações
            const guild = interaction.client.guilds.cache.get(guildId);
            const settings = (await db.query('SELECT * FROM guild_settings WHERE guild_id = $1', [guildId])).rows[0];

            if (!guild) {
                return interaction.editReply({ content: '❌ O bot não está mais nesta guilda ou ela é inválida.' });
            }

            // 2. LÓGICA NOVA: Verifica se o Dono está na Loja
            let ownerInStore = false;
            try {
                const storeGuild = interaction.client.guilds.cache.get(STORE_GUILD_ID);
                if (storeGuild) {
                    // Tenta buscar o membro. Se falhar (não estiver lá), vai pro catch.
                    // Usamos fetch para garantir que não seja erro de cache
                    await storeGuild.members.fetch(guild.ownerId); 
                    ownerInStore = true;
                }
            } catch (error) {
                ownerInStore = false; // Membro não encontrado ou erro na API
            }

            // 3. Gera a UI passando a nova info (ownerInStore)
            const payload = generateDevGuildManageMenu(interaction, guild, settings, ownerInStore);
            
            // Adiciona flag V2 se necessário (geralmente menus dev são efêmeros ou update)
            await interaction.editReply({ ...payload });

        } catch (error) {
            console.error('Erro ao gerenciar guilda (Dev):', error);
            await interaction.editReply({ content: '❌ Erro ao carregar dados da guilda.' });
        }
    }
};