// Arquivo: handlers/buttons/store_config_advanced.js
const db = require('../../database.js');
const generateConfigAdvancedMenu = require('../../ui/store/configAdvancedMenu.js');
const { V2_FLAG, EPHEMERAL_FLAG } = require('../../utils/constants.js');

module.exports = {
    customId: 'store_config_advanced',
    execute: async (interaction) => {
        // Busca as configurações atualizadas
        const settings = (await db.query('SELECT * FROM guild_settings WHERE guild_id = $1', [interaction.guild.id])).rows[0] || {};

        // Gera o menu avançado (que agora terá o botão do MP)
        const menu = generateConfigAdvancedMenu(settings);

        // Atualiza a mensagem usando o padrão V2
        await interaction.update({
            components: menu,
            flags: V2_FLAG | EPHEMERAL_FLAG
        });
    }
};