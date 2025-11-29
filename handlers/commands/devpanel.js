// handlers/commands/devpanel.js
const generateDevMainMenu = require('../../ui/devPanel/mainMenu.js');
const db = require('../../database.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'devpanel',
    async execute(interaction) {
        // Segurança: Apenas o desenvolvedor pode usar
        if (interaction.user.id !== process.env.DEV_USER_ID) {
            return interaction.reply({ content: '❌ Você não tem permissão para usar este comando.', ephemeral: true });
        }
        
        // CORREÇÃO DO ERRO: Diferencia o "defer" corretamente
        if (interaction.isButton()) {
            await interaction.deferUpdate();
        } else {
            // Comandos de barra (/) NÃO possuem deferUpdate, apenas deferReply
            await interaction.deferReply({ ephemeral: true });
        }
        
        // Garante que o status do bot exista
        await db.query("INSERT INTO bot_status (status_key, ai_services_enabled) VALUES ('main', true) ON CONFLICT (status_key) DO NOTHING");
        const botStatus = (await db.query("SELECT * FROM bot_status WHERE status_key = 'main'")).rows[0];
        
        const totalGuilds = interaction.client.guilds.cache.size;
        const totalMembers = interaction.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

        // Busca uso de tokens do dia (Feature nova que você pediu)
        const dailyTokenResult = await db.query(
            "SELECT SUM(total_tokens) as total FROM ai_usage_logs WHERE created_at >= NOW()::date"
        );
        const dailyTokenUsage = parseInt(dailyTokenResult.rows[0]?.total || '0', 10);

        const payload = {
            components: generateDevMainMenu(botStatus, { totalGuilds, totalMembers }, dailyTokenUsage),
            flags: V2_FLAG | EPHEMERAL_FLAG,
        };

        // CORREÇÃO DO ERRO: Usa sempre editReply após o defer
        await interaction.editReply(payload);
    }
};