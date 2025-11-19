// handlers/buttons/open_roletags_menu.js
const db = require('../../database.js');
const generateRoleTagsMenu = require('../../ui/roleTagsMenu.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'open_roletags_menu',
    async execute(interaction) {
        await interaction.deferUpdate();
        
        // Garante que a linha de configuração exista
        await db.query(`INSERT INTO guild_settings (guild_id) VALUES ($1) ON CONFLICT (guild_id) DO NOTHING`, [interaction.guild.id]);

        const settings = (await db.query('SELECT * FROM guild_settings WHERE guild_id = $1', [interaction.guild.id])).rows[0] || {};
        const tags = (await db.query('SELECT * FROM role_tags WHERE guild_id = $1 ORDER BY id ASC', [interaction.guild.id])).rows;
        
        await interaction.editReply({
            components: generateRoleTagsMenu(settings, tags),
            flags: V2_FLAG | EPHEMERAL_FLAG,
        });
    }
};