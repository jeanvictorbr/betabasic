// ui/devPanel/devGuildsMenu.js
const { EPHEMERAL_FLAG } = require('../../utils/constants.js');

// Função que gera os ícones baseados no DB
function getActiveModulesIcons(settings) {
    if (!settings) return '💤 *Dados não encontrados*';

    let icons = [];
    
    // Verifica cada módulo e adiciona o emoji se estiver ativo
    if (settings.store_enabled) icons.push('🛒 Loja');
    if (settings.tickets_category || settings.tickets_painel_channel) icons.push('🎫 Tickets');
    if (settings.ponto_status) icons.push('⏰ Ponto');
    if (settings.guardian_ai_enabled) icons.push('🛡️ Guardian');
    if (settings.registros_status) icons.push('📋 Reg');
    if (settings.welcome_enabled) icons.push('👋 Bem-vindo');

    // Se nenhum módulo estiver ativo, marca como SEM USO para facilitar a remoção
    if (icons.length === 0) return '⚠️ **SEM USO (Inativo)**'; 
    
    return icons.join(' | ');
}

module.exports = function createDevGuildsMenu(interaction, guildsPage, page, totalPages, sortType, guildSettingsMap) {
    const fields = guildsPage.map(guild => {
        // Pega as configurações desse servidor específico do Map
        const settings = guildSettingsMap ? guildSettingsMap.get(guild.id) : null;
        
        // Gera a string de módulos
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
        description: `Visualizando página **${page + 1}/${totalPages}**\nTotal de Servidores: **${interaction.client.guilds.cache.size}**\n\n**Legenda:** Servidores com "⚠️ SEM USO" não têm nenhum sistema configurado.`,
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
                placeholder: "Selecione para gerenciar ou sair",
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
                    custom_id: `dev_guilds_page_${page + 1}_${sortType}`, disabled: page === totalPages - 1
                },
                {
                    type: 2, style: 4, label: "Voltar",
                    custom_id: "dev_main_menu_back", emoji: { name: "🏠" }
                }
            ]
        }
    ];

    return { embeds: [embed], components: components, flags: EPHEMERAL_FLAG };
};