// utils/massRoleTask.js
const db = require('../database.js');

/**
 * Executa a tarefa de cargo em massa
 * @param {Guild} guild O servidor
 * @param {Object} options { action: 'add'|'remove', roleId: string, filterRoles: string[], initiatorId: string }
 */
async function startMassRoleTask(guild, options) {
    console.log(`[MassRole] Iniciando tarefa para ${guild.name}. Ação: ${options.action}`);

    // Busca TODOS os membros (necessário para filtrar corretamente)
    const members = await guild.members.fetch();
    const role = guild.roles.cache.get(options.roleId);

    if (!role) return;

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0; // Para quem não passou no filtro

    // Transforma array de filtro em Set para busca rápida (se houver filtros)
    const hasFilter = options.filterRoles && options.filterRoles.length > 0;
    const filterSet = new Set(options.filterRoles || []);

    // Converte a coleção de membros para array para iterar
    const memberArray = Array.from(members.values());

    // Função de delay para não tomar rate limit
    const delay = ms => new Promise(res => setTimeout(res, ms));

    for (const member of memberArray) {
        if (member.user.bot) continue; // Ignora bots

        // --- LÓGICA DO FILTRO ---
        if (hasFilter) {
            // Verifica se o membro tem ALGUM dos cargos do filtro
            const hasRequiredRole = member.roles.cache.some(r => filterSet.has(r.id));
            
            if (!hasRequiredRole) {
                skippedCount++;
                continue; // Pula este membro, ele não tem os requisitos
            }
        }
        // ------------------------

        try {
            if (options.action === 'add') {
                if (!member.roles.cache.has(role.id)) {
                    await member.roles.add(role);
                    successCount++;
                    await delay(1000); // 1 segundo de delay para segurança
                }
            } else if (options.action === 'remove') {
                if (member.roles.cache.has(role.id)) {
                    await member.roles.remove(role);
                    successCount++;
                    await delay(1000);
                }
            }
        } catch (error) {
            console.error(`Erro ao alterar cargo de ${member.user.tag}:`, error.message);
            failCount++;
        }
    }

    // Log final (Opcional: enviar para canal de log)
    console.log(`[MassRole] Finalizado. Sucesso: ${successCount}, Falhas: ${failCount}, Ignorados (Filtro): ${skippedCount}`);
    
    // Tenta avisar num canal de log se configurado (Exemplo simplificado)
    try {
        const settings = (await db.query('SELECT mod_log_channel FROM guild_settings WHERE guild_id = $1', [guild.id])).rows[0];
        if (settings && settings.mod_log_channel) {
            const channel = guild.channels.cache.get(settings.mod_log_channel);
            if (channel) {
                channel.send({ content: `✅ **Mass Role Finalizado**\nCargo: ${role.name}\nAção: ${options.action === 'add' ? 'Adicionar' : 'Remover'}\n\n✅ Aplicados: ${successCount}\n🚫 Falhas: ${failCount}\n⏭️ Ignorados (Filtro): ${skippedCount}\n\nSolicitado por: <@${options.initiatorId}>` });
            }
        }
    } catch (e) {}
}

module.exports = startMassRoleTask;