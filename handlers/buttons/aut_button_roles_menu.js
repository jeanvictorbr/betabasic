// handlers/buttons/aut_button_roles_menu.js
const db = require('../../database.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    customId: 'aut_button_roles_menu',
    async execute(interaction) {
        // Busca painéis existentes
        let panels = [];
        try {
            const res = await db.query('SELECT * FROM button_role_panels WHERE guild_id = $1 ORDER BY panel_id DESC', [interaction.guild.id]);
            panels = res.rows;
        } catch (error) {
            // Se a tabela não existir, avisa (embora você tenha dito que existe)
            console.error(error);
        }

        const embed = new EmbedBuilder()
            .setTitle('🔘 Gerenciador de Cargos Interativos')
            .setDescription('Crie painéis onde usuários clicam em botões para ganhar cargos automaticamente.')
            .setColor('Blue')
            .addFields(
                { name: '📦 Painéis Criados', value: `${panels.length}`, inline: true }
            );

        const components = [];

        // 1. Menu de Seleção de Painéis Existentes (Se houver)
        if (panels.length > 0) {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('aut_btn_sel_') // ID para editar painel
                .setPlaceholder('Selecione um painel para editar/excluir')
                .addOptions(panels.slice(0, 25).map(p => ({
                    label: p.title.substring(0, 25),
                    description: `ID: ${p.panel_id} | Botões: ${(p.roles_data || []).length}`,
                    value: p.panel_id.toString(),
                    emoji: '📝'
                })));
            components.push(new ActionRowBuilder().addComponents(selectMenu));
        } else {
            embed.setDescription(embed.data.description + '\n\n*Você ainda não criou nenhum painel.*');
        }

        // 2. Botões de Ação
        const rowButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('aut_btn_create_new') // Handler para criar novo
                .setLabel('Criar Novo Painel')
                .setEmoji('➕')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('aut_page_2') // Voltar para menu de automações página 2
                .setLabel('Voltar')
                .setStyle(ButtonStyle.Secondary)
        );
        components.push(rowButtons);

        await interaction.update({ embeds: [embed], components: components });
    }
};