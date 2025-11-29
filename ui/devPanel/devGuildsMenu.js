const { V2_FLAG, EPHEMERAL_FLAG } = require('../../utils/constants');

module.exports = (guildsData, page, totalGuilds) => {
    // guildsData é o array enriquecido com { id, name, memberCount, activeModules, healthEmoji... }

    // Cria as opções do menu de seleção com as infos detalhadas
    const options = guildsData.map(g => {
        return {
            label: g.name.substring(0, 25), // Limite do Discord
            description: `👥 ${g.memberCount} membr. | 📦 ${g.activeModules} Mods | 📅 ${g.joinedDays}d`,
            value: g.id,
            emoji: { name: g.healthEmoji } // Usa o emoji calculado (🔴, 🟢, etc)
        };
    });

    // Se a página estiver vazia (bug ou fim da lista)
    if (options.length === 0) {
        options.push({
            label: "Nenhuma guilda encontrada",
            value: "none",
            description: "Tente outra página",
            emoji: { name: "❌" }
        });
    }

    const totalPages = Math.ceil(totalGuilds / 10);

    return {
        type: 17,
        body: {
            content: `🔧 **Painel de Controle de Guildas** (Página ${page + 1}/${totalPages})\nTotal de Servidores: **${totalGuilds}**\n\n**Legenda de Status:**\n🟢 Saudável (Módulos ativos)\n🟡 Pendente (Sem módulos)\n🟠 Abandonada (< 3 membros)\n🔴 **FANTASMA** (Inativa há dias + Sem módulos)`,
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 3, // String Select
                            custom_id: "dev_guild_manage_select",
                            options: options,
                            placeholder: "🔍 Selecione uma guilda para gerenciar...",
                            min_values: 1,
                            max_values: 1
                        }
                    ]
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 2, // Secondary
                            label: "◀️ Anterior",
                            custom_id: `dev_guilds_page_${page - 1}`,
                            disabled: page === 0
                        },
                        {
                            type: 2,
                            style: 2, // Secondary
                            label: "Próximo ▶️",
                            custom_id: `dev_guilds_page_${page + 1}`,
                            disabled: (page + 1) * 10 >= totalGuilds
                        },
                        {
                            type: 2,
                            style: 4, // Danger (Vermelho)
                            label: "Voltar ao Menu",
                            custom_id: "dev_main_menu_back",
                            emoji: { name: "🏠" }
                        }
                    ]
                }
            ],
            flags: V2_FLAG | EPHEMERAL_FLAG
        }
    };
};