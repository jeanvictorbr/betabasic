const db = require('../../database.js');
const setupVoiceRoles = require('../../utils/voiceRolesSetup.js');
const createProgressBar = require('../../utils/progressBar.js'); // Usando aquele utilitário que criamos antes

module.exports = {
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guild = interaction.guild;

        // --- SETUP AUTOMÁTICO ---
        if (sub === 'setup') {
            if (!interaction.member.permissions.has('Administrator')) {
                return interaction.reply({ content: '❌ Apenas administradores podem fazer o setup.', ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });
            
            try {
                const created = await setupVoiceRoles(guild);
                await interaction.editReply(`✅ **Sucesso!** O sistema verificou os cargos.\n🆕 Cargos criados: ${created}\n\nAgora o sistema de níveis está ativo e os usuários ganharão os cargos Bronze, Prata, Ouro, etc. automaticamente.`);
            } catch (err) {
                console.error(err);
                await interaction.editReply('❌ Ocorreu um erro ao tentar criar os cargos. Verifique se o bot tem permissão de "Gerenciar Cargos" e se o cargo do bot está acima dos cargos que ele tenta criar.');
            }
            return;
        }

        // --- VER RANKING ---
        if (sub === 'ver') {
            const targetUser = interaction.options.getUser('usuario') || interaction.user;
            
            const dataRes = await db.query('SELECT * FROM user_voice_data WHERE user_id = $1 AND guild_id = $2', [targetUser.id, guild.id]);
            const data = dataRes.rows[0] || { level: 0, voice_time_mins: 0, xp: 0 };

            // Calcula tempo em horas e minutos
            const hours = Math.floor(data.voice_time_mins / 60);
            const minutes = data.voice_time_mins % 60;

            // Busca qual o próximo cargo
            const rewardsRes = await db.query('SELECT * FROM guild_level_rewards WHERE guild_id = $1 ORDER BY level ASC', [guild.id]);
            const rewards = rewardsRes.rows;
            
            // Lógica para achar próximo rank
            let nextReward = rewards.find(r => r.level > data.level);
            let currentReward = [...rewards].reverse().find(r => r.level <= data.level);

            let nextLevelMsg = "Máximo Alcançado!";
            let progressStr = createProgressBar(100, 100);

            if (nextReward) {
                // Cálculo de progresso visual baseado no XP do nível atual vs próximo
                // Simplificação: XP Atual / XP Necessário para o próximo
                const xpForNext = 50 * (nextReward.level * nextReward.level); // Inverso da fórmula de nível
                const xpForCurrent = 50 * (data.level * data.level);
                
                const totalRange = xpForNext - xpForCurrent;
                const currentProgress = data.xp - xpForCurrent;
                
                progressStr = createProgressBar(Math.max(0, currentProgress), Math.max(1, totalRange));
                nextLevelMsg = `Próximo: **${nextReward.role_name}** (Nível ${nextReward.level})`;
            }

            const embed = {
                type: 'rich',
                title: `🎤 Ranking de Voz: ${targetUser.username}`,
                color: 0x5865F2,
                thumbnail: { url: targetUser.displayAvatarURL() },
                fields: [
                    { name: '🏆 Elo Atual', value: currentReward ? `**${currentReward.role_name}**` : 'Sem Elo (Iniciante)', inline: true },
                    { name: '📊 Nível', value: `\`${data.level}\``, inline: true },
                    { name: '⏱️ Tempo Total', value: `${hours}h ${minutes}m`, inline: true },
                    { name: '📈 Progresso', value: `${progressStr}\n${nextLevelMsg}`, inline: false }
                ],
                footer: { text: 'Continue conversando nos canais de voz para subir!' }
            };

            await interaction.reply({ embeds: [embed] });
        }
    }
};