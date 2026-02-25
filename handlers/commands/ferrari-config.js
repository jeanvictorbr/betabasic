const db = require('../../database.js');

module.exports = async (interaction, guildSettings) => {
    const canalLogs = interaction.options.getChannel('canal_logs');
    const cargoStaff = interaction.options.getRole('cargo_staff');
    const vTitle = interaction.options.getString('vitrine_titulo');
    const vDesc = interaction.options.getString('vitrine_desc');
    const vImg = interaction.options.getString('vitrine_imagem');

    let updates = [];
    let values = [];
    let queryIndex = 1;

    if (canalLogs) { updates.push(`ferrari_log_channel = $${queryIndex++}`); values.push(canalLogs.id); }
    if (cargoStaff) { updates.push(`ferrari_staff_role = $${queryIndex++}`); values.push(cargoStaff.id); }
    if (vTitle) { updates.push(`ferrari_vitrine_title = $${queryIndex++}`); values.push(vTitle); }
    if (vDesc) { updates.push(`ferrari_vitrine_desc = $${queryIndex++}`); values.push(vDesc); }
    if (vImg) { updates.push(`ferrari_vitrine_image = $${queryIndex++}`); values.push(vImg); }

    if (updates.length === 0) return interaction.reply({ content: '❌ Você não forneceu nenhuma configuração para alterar.', ephemeral: true });

    values.push(interaction.guildId);
    await db.query(`UPDATE guild_settings SET ${updates.join(', ')} WHERE guild_id = $${queryIndex}`, values);

    await interaction.reply({ content: '✅ Configurações do Módulo Ferrari atualizadas com sucesso!', ephemeral: true });
};