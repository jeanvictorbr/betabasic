/**
 * Gera a interface visual da Escada de Níveis (Roadmap)
 */
module.exports = (userLevel, rewards, guildName) => {
    // Ordena recompensas do menor para o maior nível
    const sortedRewards = rewards.sort((a, b) => a.level - b.level);

    let description = `Aqui está o sistema de evolução de voz do **${guildName}**. Fique em call (mesmo mutado) para subir!\n\n`;

    // Constrói a lista visual
    const steps = sortedRewards.map(reward => {
        const isUnlocked = userLevel >= reward.level;
        const statusIcon = isUnlocked ? '✅' : '🔒';
        const style = isUnlocked ? '**' : ''; // Negrito se desbloqueado
        
        // Simulação de tempo baseado na fórmula XP (10xp/min) e Nível = sqrt(xp/50)
        // XP necessário = 50 * level^2
        // Minutos = XP / 10
        // Horas = Minutos / 60
        const xpRequired = 50 * (reward.level * reward.level);
        const hoursRequired = Math.round((xpRequired / 10) / 60);

        return `${statusIcon} ${style}Nível ${reward.level} - ${reward.role_name}${style}\n└ *Requer aprox. ${hoursRequired} horas de voz*`;
    }).join('\n\n');

    if (sortedRewards.length === 0) {
        description += "*Nenhum nível configurado neste servidor ainda.*";
    } else {
        description += steps;
    }

    return {
        embeds: [{
            title: `🏆 Ranking de Voz: ${guildName}`,
            description: description,
            color: 0xFFD700, // Gold
            footer: { text: `Seu Nível Atual: ${userLevel}` }
        }],
        flags: 1 << 6 // Ephemeral (opcional, pode remover se quiser publico)
    };
};