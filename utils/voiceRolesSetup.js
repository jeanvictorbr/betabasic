const db = require('../database.js');
const { PermissionFlagsBits } = require('discord.js');

// Configuração Padrão da Hierarquia
const DEFAULT_RANKS = [
    { level: 1, name: 'Bronze', color: '#CD7F32' },
    { level: 10, name: 'Prata', color: '#C0C0C0' },
    { level: 25, name: 'Ouro', color: '#FFD700' },
    { level: 40, name: 'Platina', color: '#E5E4E2' },
    { level: 60, name: 'Diamante', color: '#B9F2FF' },
    { level: 80, name: 'Mestre', color: '#FF00FF' },
    { level: 100, name: 'Lenda', color: '#FF0000' } // Vermelho Sangue
];

/**
 * Verifica e cria os cargos de ranking no servidor automaticamente.
 * @param {import('discord.js').Guild} guild 
 */
async function setupVoiceRoles(guild) {
    let createdCount = 0;
    const existingRewards = await db.query('SELECT * FROM guild_level_rewards WHERE guild_id = $1', [guild.id]);
    
    // Mapa para verificar o que já temos configurado no DB
    const configuredLevels = new Set(existingRewards.rows.map(r => r.level));

    for (const rank of DEFAULT_RANKS) {
        // Se já existe configuração para este nível, pulamos (ou verificamos se o cargo ainda existe no Discord)
        if (configuredLevels.has(rank.level)) {
            // Opcional: Adicionar lógica para recriar se o cargo foi deletado manualmente do Discord
            continue;
        }

        // Tenta encontrar um cargo com esse nome exato para não duplicar se o admin criou na mão
        let role = guild.roles.cache.find(r => r.name === rank.name);

        if (!role) {
            // Cria o cargo se não existir
            try {
                role = await guild.roles.create({
                    name: rank.name,
                    color: rank.color,
                    reason: 'Setup Automático de Ranking de Voz do Koda',
                    permissions: [] // Cargos cosméticos, sem permissões perigosas
                });
            } catch (err) {
                console.error(`Erro ao criar cargo ${rank.name} em ${guild.name}:`, err);
                continue;
            }
        }

        // Salva no Banco de Dados
        await db.query(`
            INSERT INTO guild_level_rewards (guild_id, level, role_id, role_name)
            VALUES ($1, $2, $3, $4)
        `, [guild.id, rank.level, role.id, rank.name]);

        createdCount++;
    }

    return createdCount;
}

module.exports = setupVoiceRoles;