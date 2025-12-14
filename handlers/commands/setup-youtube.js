const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-youtube')
        .setDescription('Cole o JSON da extensão Cookie-Editor aqui')
        .addStringOption(option => 
            option.setName('json')
                .setDescription('Cole o conteúdo que você exportou da extensão')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: '❌ Apenas o dono pode fazer isso.', ephemeral: true });
        }

        const rawJson = interaction.options.getString('json');
        let finalCookie = '';

        try {
            const cookies = JSON.parse(rawJson);
            if (Array.isArray(cookies)) {
                // Pega apenas os cookies essenciais para o YouTube não reclamar
                const essentialCookies = cookies.map(c => `${c.name}=${c.value}`).join('; ');
                finalCookie = essentialCookies;
            } else {
                finalCookie = rawJson;
            }

            await db.query(`
                INSERT INTO bot_status (status_key, maintenance_message) 
                VALUES ('youtube_config', $1) 
                ON CONFLICT (status_key) 
                DO UPDATE SET maintenance_message = $1
            `, [finalCookie]);

            process.env.YOUTUBE_COOKIES = finalCookie;

            await interaction.reply({ 
                content: '✅ **YouTube Configurado!** Tente usar `/tocar` agora.', 
                ephemeral: true 
            });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Erro ao ler o código. Copie TUDO da extensão.', ephemeral: true });
        }
    }
};