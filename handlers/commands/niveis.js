const db = require('../../database.js');
const generateLadderUI = require('../../ui/rankingLadder.js');

module.exports = {
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        // --- VISUALIZAR (Para todos os usuários) ---
        if (sub === 'ver') {
            await interaction.deferReply({ ephemeral: true });

            // Pega nível do usuário
            const userRes = await db.query('SELECT level FROM user_voice_data WHERE user_id = $1 AND guild_id = $2', [interaction.user.id, guildId]);
            const userLevel = userRes.rows.length > 0 ? userRes.rows[0].level : 0;

            // Pega recompensas configuradas
            const rewardsRes = await db.query('SELECT * FROM guild_level_rewards WHERE guild_id = $1', [guildId]);
            
            const ui = generateLadderUI(userLevel, rewardsRes.rows, interaction.guild.name);
            return interaction.editReply(ui);
        }

        // --- CONFIGURAÇÃO (Apenas Admin) ---
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ Apenas administradores podem configurar níveis.', ephemeral: true });
        }

        if (sub === 'configurar') {
            const level = interaction.options.getInteger('nivel');
            const role = interaction.options.getRole('cargo');
            const name = interaction.options.getString('nome');

            await db.query(`
                INSERT INTO guild_level_rewards (guild_id, level, role_id, role_name)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id) DO NOTHING
            `, [guildId, level, role.id, name]); 
            // Nota: Se quiser permitir update, a lógica SQL muda um pouco, mas insert simples funciona para adicionar novos.

            return interaction.reply({ content: `✅ Configurado! Nível **${level}** dará o cargo **${role.name}** com o título **${name}**.`, ephemeral: true });
        }

        if (sub === 'remover') {
            const level = interaction.options.getInteger('nivel');
            await db.query('DELETE FROM guild_level_rewards WHERE guild_id = $1 AND level = $2', [guildId, level]);
            return interaction.reply({ content: `🗑️ Configuração do nível **${level}** removida.`, ephemeral: true });
        }
    }
};