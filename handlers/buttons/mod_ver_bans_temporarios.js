// handlers/buttons/mod_ver_bans_temporarios.js
const generateModeracaoBansMenu = require('../../ui/moderacaoBansMenu.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'mod_ver_bans_temporarios',
    async execute(interaction) {
        await interaction.deferUpdate();
        
        const bans = await interaction.guild.bans.fetch();
        const bannedUsers = Array.from(bans.values());

        // Agora chama a UI com a lista completa e a página inicial (0)
        await interaction.editReply({
            components: generateModeracaoBansMenu(bannedUsers, 0),
            flags: V2_FLAG | EPHEMERAL_FLAG,
        });
    }
};