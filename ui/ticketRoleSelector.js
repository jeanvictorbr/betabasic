module.exports = function ticketRoleSelector(deptName, allRoles, selectedRoleIds, page = 0) {
    const ROLES_PER_PAGE = 12; // 4 linhas de 3 botões
    const totalPages = Math.ceil(allRoles.length / ROLES_PER_PAGE);
    
    // Garante que a página esteja dentro dos limites
    page = Math.max(0, Math.min(page, totalPages - 1));

    // Fatia os cargos para a página atual
    const start = page * ROLES_PER_PAGE;
    const currentRoles = allRoles.slice(start, start + ROLES_PER_PAGE);

    // 1. Constrói a Grade de Botões dos Cargos
    // Precisamos dividir em linhas de 3 botões (ActionRows)
    const roleRows = [];
    let currentRowComponents = [];

    for (let i = 0; i < currentRoles.length; i++) {
        const role = currentRoles[i];
        const isSelected = selectedRoleIds.includes(role.id);

        currentRowComponents.push({
            type: 2, // Button
            style: isSelected ? 3 : 2, // 3 = Green (Success), 2 = Grey (Secondary)
            label: role.name.substring(0, 80), // Corta nome longo
            // ID: prefixo + AÇÃO + ID_CARGO
            custom_id: `tkt_role_toggle_${role.id}` 
        });

        // Se encheu a linha com 3 ou é o último item, fecha a linha
        if (currentRowComponents.length === 3 || i === currentRoles.length - 1) {
            roleRows.push({
                type: 1, // Action Row
                components: currentRowComponents
            });
            currentRowComponents = [];
        }
    }

    // 2. Constrói a Linha de Navegação e Confirmação (Sempre na base)
    const navRow = {
        type: 1,
        components: [
            {
                type: 2,
                style: 1, // Primary (Blurple)
                label: '◀ Anterior',
                custom_id: `tkt_role_nav_prev_${page}`,
                disabled: page === 0
            },
            {
                type: 2,
                style: 1, // Primary
                label: `Página ${page + 1}/${totalPages || 1}`,
                custom_id: 'tkt_role_nav_ignore', // Botão apenas informativo
                disabled: true
            },
            {
                type: 2,
                style: 1, // Primary
                label: 'Próximo ▶',
                custom_id: `tkt_role_nav_next_${page}`,
                disabled: page >= totalPages - 1
            },
            {
                type: 2,
                style: 3, // Green
                label: `✅ Salvar (${selectedRoleIds.length})`,
                custom_id: 'tkt_role_save'
            }
        ]
    };

    // Adiciona a navegação ao final das linhas de cargos
    const allComponents = [...roleRows, navRow];

    // Lista formatada para o Embed
    const selectedMentions = selectedRoleIds.length > 0 
        ? selectedRoleIds.map(id => `<@&${id}>`).join(', ').substring(0, 1024) 
        : 'Nenhum cargo selecionado.';

    return {
        embeds: [
            {
                title: `🛠️ Configurando: ${deptName}`,
                description: 'Clique nos botões abaixo para **Ativar/Desativar** os cargos que terão acesso a este departamento.\nQuando terminar, clique em **Salvar**.',
                color: 0x2b2d31,
                fields: [
                    {
                        name: `📋 Cargos Selecionados (${selectedRoleIds.length})`,
                        value: selectedMentions
                    }
                ]
            }
        ],
        components: allComponents,
        flags: 64 // Ephemeral
    };
};