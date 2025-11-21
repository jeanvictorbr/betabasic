// Arquivo: handlers/buttons/store_config_advanced.js
const db = require('../../database.js');
const generateConfigAdvancedMenu = require('../../ui/store/configAdvancedMenu.js');
const { V2_FLAG, EPHEMERAL_FLAG } = require('../../utils/constants.js');

module.exports = {
    customId: 'store_config_advanced',
    execute: async (interaction) => {
        const settings = (await db.query('SELECT * FROM guild_settings WHERE guild_id = $1', [interaction.guild.id])).rows[0] || {};
        
        const menu = generateConfigAdvancedMenu(settings);

        // Usa update para trocar o menu principal pelo avançado
        await interaction.update({
            components: menu,
            flags: V2_FLAG | EPHEMERAL_FLAG
        });
    }
};