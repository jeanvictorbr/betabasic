const db = require('../database.js');
const setupVoiceRoles = require('./voiceRolesSetup.js'); // Importa o auto-setup

const XP_PER_MINUTE = 10;

async function startVoiceMonitor(client) {
    setInterval(async () => {
        try {
            for (const [guildId, guild] of client.guilds.cache) {
                // Pega o canal AFK do servidor (se tiver, para não contar tempo lá)
                const afkChannelId = guild.afkChannelId;

                for (const [memberId, voiceState] of guild.voiceStates.cache) {
                    const member = voiceState.member;
                    
                    if (!member || member.user.bot) continue;
                    if (voiceState.channelId === afkChannelId) continue;
                    if (!voiceState.channelId) continue; // Precisa estar em um canal

                    // --- LÓGICA DE XP ---
                    const checkUser = await db.query(
                        'SELECT * FROM user_voice_data WHERE user_id = $1 AND guild_id = $2',
                        [memberId, guildId]
                    );

                    let currentXp = 0;
                    let currentLevel = 0;
                    let timeMins = 0;

                    if (checkUser.rows.length === 0) {
                        await db.query(
                            'INSERT INTO user_voice_data (user_id, guild_id, voice_time_mins, xp, level) VALUES ($1, $2, 1, $3, 0)',
                            [memberId, guildId, XP_PER_MINUTE]
                        );
                        currentXp = XP_PER_MINUTE;
                        timeMins = 1;
                    } else {
                        const data = checkUser.rows[0];
                        currentXp = data.xp + XP_PER_MINUTE;
                        timeMins = data.voice_time_mins + 1;
                        currentLevel = data.level;

                        await db.query(
                            'UPDATE user_voice_data SET voice_time_mins = $1, xp = $2, last_update = NOW() WHERE user_id = $3 AND guild_id = $4',
                            [timeMins, currentXp, memberId, guildId]
                        );
                    }

                    // --- CÁLCULO DE NÍVEL ---
                    // Fórmula: Nível = Raiz Quadrada de (XP / 50). Ajustado para a escala proposta.
                    const newLevel = Math.floor(Math.sqrt(currentXp / 50));

                    // --- LEVEL UP & TROCA DE CARGOS ---
                    if (newLevel > currentLevel) {
                        // Salva novo nível
                        await db.query(
                            'UPDATE user_voice_data SET level = $1 WHERE user_id = $2 AND guild_id = $3',
                            [newLevel, memberId, guildId]
                        );

                        // Busca todas as recompensas configuradas
                        const rewardsConfig = await db.query(
                            'SELECT * FROM guild_level_rewards WHERE guild_id = $1 ORDER BY level ASC',
                            [guildId]
                        );

                        // Se não tiver recompensas configuradas, tenta rodar o setup automático agora
                        if (rewardsConfig.rows.length === 0) {
                            await setupVoiceRoles(guild);
                            // Na próxima rodada do minuto ele vai pegar o cargo, para não travar o loop agora
                            continue; 
                        }

                        // Lógica de "Elo": Pega o maior cargo alcançado e remove os inferiores
                        let roleToAdd = null;
                        const rolesToRemove = [];

                        for (const reward of rewardsConfig.rows) {
                            if (newLevel >= reward.level) {
                                roleToAdd = reward.role_id; // Este é o cargo mais alto que ele pode ter
                            }
                            rolesToRemove.push(reward.role_id); // Lista todos para remover os antigos
                        }

                        if (roleToAdd) {
                            // Filtra para não remover o que vamos adicionar
                            const finalRolesToRemove = rolesToRemove.filter(id => id !== roleToAdd);

                            // Remove antigos
                            for (const remId of finalRolesToRemove) {
                                if (member.roles.cache.has(remId)) {
                                    await member.roles.remove(remId).catch(() => {});
                                }
                            }

                            // Adiciona o novo
                            if (!member.roles.cache.has(roleToAdd)) {
                                const roleObj = guild.roles.cache.get(roleToAdd);
                                if (roleObj) {
                                    await member.roles.add(roleObj).catch(console.error);
                                    // Opcional: Enviar DM ou msg no chat avisando do Rank UP
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[Voice Monitor] Erro:', error);
        }
    }, 60000); // Roda a cada 60s
}

module.exports = startVoiceMonitor;