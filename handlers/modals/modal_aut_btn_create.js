const db = require('../../database.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    customId: 'modal_aut_btn_create',
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const title = interaction.fields.getTextInputValue('input_panel_title');
            let description = interaction.fields.getTextInputValue('input_panel_desc');
            const guildId = interaction.guild.id;

            // [CONFIGURAÇÃO AUTOMÁTICA]
            // Se o usuário não escreveu descrição, coloca uma explicativa padrão
            if (!description) {
                description = "Utilize o menu abaixo para gerenciar seus cargos.\n\n" +
                              "✅ **Selecione** para receber o cargo.\n" +
                              "❌ **Desmarque** para remover o cargo.\n\n" +
                              "*Suas alterações são aplicadas imediatamente.*";
            }

            // Salva no banco
            const res = await db.query(
                `INSERT INTO button_role_panels (guild_id, title, description, roles_data)
                 VALUES ($1, $2, $3, '[]')
                 RETURNING panel_id`,
                [guildId, title, description]
            );

            const panelId = res.rows[0].panel_id;

            // Retorna o painel de gerenciamento
            const embed = new EmbedBuilder()
                .setTitle('✅ Painel Criado com Sucesso!')
                .setDescription(`**Título:** ${title}\n**ID:** ${panelId}\n\nAgora adicione os cargos que aparecerão no menu.`)
                .setColor('Green')
                .setFooter({ text: 'Sistema de Auto-Cargos' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`aut_pnl_add_role_${panelId}`) // Usa o novo sistema de Select Menu de cargos
                    .setLabel('Adicionar Cargo')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('➕'),
                new ButtonBuilder()
                    .setCustomId(`aut_btn_send_panel_${panelId}`)
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