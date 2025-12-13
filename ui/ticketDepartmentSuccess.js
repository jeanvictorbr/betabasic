// ui/ticketDepartmentSuccess.js
module.exports = function ticketDepartmentSuccess(deptName, roleIds) {
    // Formata a lista de cargos
    const rolesFormatted = roleIds.map(id => `<@&${id}>`).join(', ');

    return {
        // [IMPORTANTE] Não incluir 'content' aqui de jeito nenhum
        embeds: [
            {
                title: '✅ Departamento Criado com Sucesso!',
                description: `O departamento **${deptName}** foi configurado.`,
                color: 0x57F287, // Green
                fields: [
                    {
                        name: '🛡️ Cargos Responsáveis',
                        value: rolesFormatted || 'Nenhum cargo identificado.'
                    },
                    {
                        name: 'ℹ️ Dica',
                        value: 'Use /configurar novamente para ver o painel atualizado.'
                    }
                ],
                footer: {
                    text: 'BasicFlow Ticket System'
                }
            }
        ],
        components: [] // Array vazio para remover o menu de seleção da tela
    };
};