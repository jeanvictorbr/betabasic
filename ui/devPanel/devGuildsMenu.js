// ui/devPanel/devGuildsMenu.js

// Função para gerar ícones de status
function getActiveModulesIcons(settings) {
    if (!settings) return '💤 *Sem config no DB*';

    let icons = [];
    if (settings.store_enabled) icons.push('🛒');
    if (settings.tickets_category || settings.tickets_painel_channel) icons.push('🎫');
    if (settings.ponto_status) icons.push('⏰');
    if (settings.guardian_ai_enabled) icons.push('🛡️');
    if (settings.registros_status) icons.push('📋');
    if (settings.welcome_enabled) icons.push('👋');

    if (icons.length === 0) return '⚠️ **SEM USO**';
    return icons.join(' ');
}

// Assinatura da função corrigida para bater com o Handler
module.exports = function createDevGuildsMenu(guildsPage, page, totalPages, sortType, guildSettingsMap) {
    
    const fields = guildsPage.map(guild => {
        const settings = guildSettingsMap ? guildSettingsMap.get(guild.id) : null;
        const modulesStr = getActiveModulesIcons(settings);
        const ownerId = guild.ownerId || 'Desconhecido';
        
        return {
            name: `${guild.name}`,
            value: `🆔 \`${guild.id}\` | 👑 <@${ownerId}>\n📊 **Status:** ${modulesStr}\n👥 **Membros:** \`${guild.memberCount}\``,
            inline: false
        };
    });

    const embed = {
        type: "rich",
        title: "💻 Painel de Controle - Lista de Servidores",
        description: `Visualizando página **${page + 1}/${totalPages}**\n\n> 🛒=Loja | 🎫=Tickets | ⏰=Ponto | 🛡️=Guardian | 📋=Reg\n> ⚠️=Provável Inativo (Sem configs)`,
        color: 0x2b2d31,
        fields: fields,
        footer: {
            text: `Ordenação: ${sortType === 'members' ? 'Por Membros' : 'Por Nome'}`
        }
    };

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
                placeholder: "Selecione um servidor para gerenciar",
                min_values: 1,
                max_values: 1
            }]
        },
        {
            type: 1,
            components: [
                {
                    type: 2, style: 2, label: "Anterior",
                    custom_id: `dev_guilds_page_${page - 1}_${sortType}`, disabled: page === 0
                },
                {
                    type: 2, style: 1, label: sortType === 'members' ? "Ordenar: Nome" : "Ordenar: Membros",
                    custom_id: `dev_guilds_sort_${sortType === 'members' ? 'name' : 'members'}_${page}`, emoji: { name: "🔃" }
                },
                {
                    type: 2, style: 2, label: "Próxima",
                    custom_id: `dev_guilds_page_${page + 1}_${sortType}`, disabled: page + 1 >= totalPages - 1
                },
                {
                    type: 2, style: 4, label: "Voltar",
                    custom_id: "dev_main_menu_back", emoji: { name: "🏠" }
                }
            ]
        }
    ];

    // Retorna apenas o objeto de dados, sem flags (as flags são adicionadas no handler)
    return { embeds: [embed], components: components };
};