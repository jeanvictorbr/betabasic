// handlers/selects/aut_mass_add_role_select.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, RoleSelectMenuBuilder } = require('discord.js');

module.exports = {
    customId: 'aut_mass_add_role_select',
    async execute(interaction) {
        const roleIdToAdd = interaction.values[0];

        // Salva temporariamente no cache do bot o cargo que será ADICIONADO
        // Key: userID_guildID
        const cacheKey = `mass_role_${interaction.user.id}_${interaction.guild.id}`;
        interaction.client.massRoleCache = interaction.client.massRoleCache || new Map();
        interaction.client.massRoleCache.set(cacheKey, { 
            action: 'add',
            roleToAdd: roleIdToAdd, 
            filterRoles: [] // Inicialmente vazio (todos)
        });

        const row = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
                .setCustomId('aut_mass_filter_select')
                .setPlaceholder('Selecione os cargos que os membros DEVEM ter')
                .setMinValues(1)
                .setMaxValues(20)
        );

        const rowBtns = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('aut_mass_add_confirm_all') // Botão para pular filtro
                .setLabel('Não filtrar (Aplicar a Todos)')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('aut_mass_roles_menu')
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.update({
            content: `📂 **Passo 2:** Filtragem de Membros.\n\nO cargo <@&${roleIdToAdd}> será adicionado.\n\n❓ **Quem deve receber este cargo?**\nSelecione abaixo os cargos "Filtro". Apenas quem tiver **um dos cargos selecionados** receberá o novo cargo.\n\n*Exemplo: Se selecionar "Vip", apenas quem já é Vip ganhará o cargo novo.*`,
            components: [row, rowBtns],
            embeds: []
        });
    }
};