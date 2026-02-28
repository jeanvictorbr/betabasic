const db = require('../../database.js');

module.exports = async (interaction) => {
    const canal = interaction.options.getChannel('canal');
    
    // Cria a coluna no banco caso não exista e salva o canal
    await db.query(`ALTER TABLE guild_settings ADD COLUMN IF NOT EXISTS ferrari_logs_channel VARCHAR(50)`).catch(()=>{});
    await db.query('UPDATE guild_settings SET ferrari_logs_channel = $1 WHERE guild_id = $2', [canal.id, interaction.guildId]);
    
    await interaction.reply({ content: `✅ Canal de logs de Estoque definido para ${canal}. Todas as alterações feitas pelos funcionários sairão lá!`, ephemeral: true });
};