// Substitua em: handlers/selects/select_guardian_alert_channel.js
const db = require('../../database.js');
const generateGuardianAlertsHubMenu = require('../../ui/guardianAlertsHubMenu.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'select_guardian_alert_channel',
    async execute(interaction) {
        await interaction.deferUpdate();
        // A lógica de apagar o canal é feita limpando a seleção no menu
        const channelId = interaction.values.length > 0 ? interaction.values[0] : null;

        await db.query(`UPDATE guild_settings SET guardian_ai_alert_channel = $1 WHERE guild_id = $2`, [channelId, interaction.guild.id]);
        
        const settings = (await db.query('SELECT * FROM guild_settings WHERE guild_id = $1', [interaction.guild.id])).rows[0] || {};
        await interaction.editReply({
            components: generateGuardianAlertsHubMenu(settings),
            flags: V2_FLAG | EPHEMERAL_FLAG,
        });
    }
};