// ui/ticketDepartmentCreated.js
module.exports = function ticketDepartmentCreated(deptName, roleIds) {
    // Formata a lista de menções aos cargos
    const rolesFormatted = roleIds.map(id => `<@&${id}>`).join(', ');

    return {
        // Na estrutura V2/Interações, se não tem content, não enviamos a chave content
        embeds: [
            {
                title: '✅ Departamento Salvo!',
                description: `O departamento **${deptName}** foi criado com sucesso e os cargos foram vinculados.`,
                fields: [
                    {
                        name: '🎭 Cargos Responsáveis',
                        value: rolesFormatted || 'Nenhum selecionado'
                    }
                ],
                color: 0x57F287, // Green
                footer: {
                    text: 'BasicFlow Ticket System'
                }
            }
        ],
        components: [] // Array vazio remove o menu de seleção anterior
    };
};