// ui/devPanel/devGuildsMenu.js
const { EPHEMERAL_FLAG } = require('../../utils/constants.js');

// Função auxiliar para determinar ícones de módulos ativos
function getActiveModulesIcons(settings) {
    if (!settings) return '💤 *Sem dados*';

    let icons = [];
    
    // Verifica módulos principais
    if (settings.store_enabled) icons.push('🛒'); // Loja
    if (settings.tickets_category || settings.tickets_painel_channel) icons.push('🎫'); // Tickets (Se tiver categoria ou painel)
    if (settings.ponto_status) icons.push('⏰'); // Ponto
    if (settings.guardian_ai_enabled) icons.push('🛡️'); // Guardian
    if (settings.registros_status) icons.push('📋'); // Registros
    if (settings.welcome_enabled) icons.push('👋'); // Boas-vindas

    if (icons.length === 0) return '⚠️ **SEM USO**'; // Destaque para facilitar remoção
    return icons.join(' ');
}

module.exports = function createDevGuildsMenu(interaction, guildsPage, page, totalPages, sortType, guildSettingsMap) {
    // guildSettingsMap: Objeto ou Map onde a chave é o ID da guilda e o valor é o objeto de settings do DB

    const fields = guildsPage.map(guild => {
        const settings = guildSettingsMap ? guildSettingsMap.get(guild.id) : null;
        const modulesStr = getActiveModulesIcons(settings);
        const ownerId = guild.ownerId || 'Desconhecido';
        
        return {
            name: `${guild.name}`,
            value: `🆔 \`${guild.id}\` | 👑 <@${ownerId}>\n📊 **Módulos:** ${modulesStr}\n👥 **Membros:** \`${guild.memberCount}\``,
            inline: false
        };
    });

    const embed = {
        type: "rich",
        title: "💻 Painel de Controle - Lista de Servidores",
        description: `Visualizando página **${page + 1}/${totalPages}**\nTotal de Servidores: **${interaction.client.guilds.cache.size}**\n\n> 🛒=Loja | 🎫=Tickets | ⏰=Ponto | 🛡️=Guardian | 📋=Registros`,
        color: 0x2b2d31,
        fields: fields,
        footer: {
            text: `Modo de Ordenação: ${sortType === 'members' ? 'Membros' : 'Nome'}`
        }
    };

    // Gera as opções do menu de seleção
    const selectOptions = guildsPage.map(guild => ({
        label: guild.name.substring(0, 25),
        description: `ID: ${guild.id}`,
        value: guild.id,
        emoji: { name: "🔧" }
    }));

    const components = [
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "dev_guild_manage_select",
                options: selectOptions,
                placeholder: "Selecione um servidor para gerenciar/remover",
                min_values: 1,
                max_values: 1
            }]
        },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 2,
                    label: "Anterior",
                    custom_id: `dev_guilds_page_${page - 1}_${sortType}`,
                    disabled: page === 0
                },
                {
                    type: 2,
                    style: 1, // Primary color para destacar
                    label: sortType === 'members' ? "Ordenar por Nome" : "Ordenar por Membros",
                    custom_id: `dev_guilds_sort_${sortType === 'members' ? 'name' : 'members'}_${page}`,
                    emoji: { name: "🔃" }
                },
                {
                    type: 2,
                    style: 2,
                    label: "Próxima",
                    custom_id: `dev_guilds_page_${page + 1}_${sortType}`,
                    disabled: page === totalPages - 1
                },
                {
                    type: 2,
                    style: 4, // Vermelho para sair
                    label: "Voltar ao Menu",
                    custom_id: "dev_main_menu_back",
                    emoji: { name: "🏠" }
                }
            ]
        }
    ];

    return { embeds: [embed], components: components, flags: EPHEMERAL_FLAG };
};