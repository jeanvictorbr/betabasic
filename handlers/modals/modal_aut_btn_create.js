const db = require('../../database.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    customId: 'modal_aut_btn_create',
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const title = interaction.fields.getTextInputValue('input_panel_title');
            const description = interaction.fields.getTextInputValue('input_panel_desc');
            const guildId = interaction.guild.id;

            // Salva no banco (agora sem o default que dava erro)
            const res = await db.query(
                `INSERT INTO button_role_panels (guild_id, title, description, roles_data)
                 VALUES ($1, $2, $3, '[]')
                 RETURNING panel_id`,
                [guildId, title, description]
            );

            const panelId = res.rows[0].panel_id;

            // Retorna o painel de gerenciamento deste item
            const embed = new EmbedBuilder()
                .setTitle('✅ Painel Criado!')
                .setDescription(`O painel **"${title}"** foi registrado (ID: ${panelId}).\n\nAgora adicione os cargos que aparecerão no menu de seleção.`)
                .setColor('Green');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`aut_btn_add_item_${panelId}`) // Botão para adicionar cargo
                    .setLabel('Adicionar Cargo')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('➕'),
                new ButtonBuilder()
                    .setCustomId(`aut_btn_send_panel_${panelId}`) // Botão para enviar no chat
                    .setLabel('Enviar no Canal')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('📤')
            );

            await interaction.editReply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Erro ao salvar painel no banco de dados.' });
        }
    }
};