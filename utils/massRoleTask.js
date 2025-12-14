// utils/massRoleTask.js
const db = require('../database.js');
const { EmbedBuilder } = require('discord.js'); // Necessário para criar o embed bonito

/**
 * Executa a tarefa de cargo em massa
 * @param {Guild} guild O servidor
 * @param {Object} options { action: 'add'|'remove', roleId: string, filterRoles: string[], initiatorId: string }
 */
async function startMassRoleTask(guild, options) {
    console.log(`[MassRole] Iniciando tarefa para ${guild.name}. Ação: ${options.action}`);

    // Busca TODOS os membros e o cargo alvo
    const members = await guild.members.fetch();
    const role = guild.roles.cache.get(options.roleId);

    // Se o cargo não existir, tenta avisar quem pediu (se possível) e para
    if (!role) {
        try {
            const user = await guild.members.fetch(options.initiatorId);
            user.send(`❌ Erro: O cargo ID ${options.roleId} não foi encontrado no servidor durante a execução.`);
        } catch (e) {}
        return;
    }

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0; // Membros que não passaram no filtro ou já tinham o cargo

    // Prepara o filtro
    const hasFilter = options.filterRoles && options.filterRoles.length > 0;
    const filterSet = new Set(options.filterRoles || []);

    const memberArray = Array.from(members.values());
    
    // Delay para evitar Rate Limit do Discord
    const delay = ms => new Promise(res => setTimeout(res, ms));

    for (const member of memberArray) {
        if (member.user.bot) continue; // Ignora bots

        // 1. Lógica do Filtro (Se ativado)
        if (hasFilter) {
            const hasRequiredRole = member.roles.cache.some(r => filterSet.has(r.id));
            if (!hasRequiredRole) {
                skippedCount++;
                continue; 
            }
        }

        // 2. Aplicação do Cargo
        try {
            if (options.action === 'add') {
                if (!member.roles.cache.has(role.id)) {
                    await member.roles.add(role);
                    successCount++;
                    await delay(1000); // Espera 1s entre cada ação
                } else {
                    skippedCount++; // Já tem o cargo
                }
            } else if (options.action === 'remove') {
                if (member.roles.cache.has(role.id)) {
                    await member.roles.remove(role);
                    successCount++;
                    await delay(1000);
                } else {
                    skippedCount++; // Já não tem o cargo
                }
            }
        } catch (error) {
            console.error(`Erro ao alterar cargo de ${member.user.tag}:`, error.message);
            failCount++;
        }
    }

    console.log(`[MassRole] Finalizado. Sucesso: ${successCount}, Falhas: ${failCount}, Ignorados: ${skippedCount}`);

    // --- NOTIFICAÇÕES FINAIS ---

    // 1. Notifica o ADMIN no PRIVADO (O que faltava)
    try {
        const initiator = await guild.members.fetch(options.initiatorId).catch(() => null);
        if (initiator) {
            const dmEmbed = new EmbedBuilder()
                .setTitle('✅ Tarefa em Massa Concluída')
                .setColor('Green')
                .setDescription(`A operação de cargos solicitada no servidor **${guild.name}** foi finalizada.`)
                .addFields(
                    { name: '🎯 Cargo Alvo', value: role.name, inline: true },
                    { name: '🔧 Ação', value: options.action === 'add' ? 'Adicionar' : 'Remover', inline: true },
                    { name: '📊 Resultado', value: `✅ **Sucesso:** ${successCount}\n❌ **Falhas:** ${failCount}\n⏭️ **Ignorados/Filtrados:** ${skippedCount}`, inline: false }
                )
                .setTimestamp();

            await initiator.send({ embeds: [dmEmbed] }).catch(() => console.log('Não foi possível enviar DM para o admin.'));
        }
    } catch (e) {
        console.error('[MassRole] Erro ao enviar DM:', e);
    }

    // 2. Log no Canal de Logs do Servidor (Se configurado)
    try {
        const settings = (await db.query('SELECT mod_log_channel FROM guild_settings WHERE guild_id = $1', [guild.id])).rows[0];
        if (settings && settings.mod_log_channel) {
            const channel = guild.channels.cache.get(settings.mod_log_channel);
            if (channel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('🤖 Log de Cargos em Massa')
                    .setColor('Blue')
                    .addFields(
                        { name: 'Executor', value: `<@${options.initiatorId}>`, inline: true },
                        { name: 'Cargo', value: role.name, inline: true },
                        { name: 'Ação', value: options.action === 'add' ? 'Adicionar' : 'Remover', inline: true },
                        { name: 'Aplicados', value: `${successCount}`, inline: true },
                        { name: 'Falhas', value: `${failCount}`, inline: true }
                    )
                    .setTimestamp();
                
                await channel.send({ embeds: [logEmbed] });
            }
        }
    } catch (e) {
        console.error('[MassRole] Erro ao enviar log no canal:', e);
    }
}

module.exports = startMassRoleTask;