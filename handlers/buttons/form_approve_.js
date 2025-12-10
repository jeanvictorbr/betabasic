const db = require('../../database.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    customId: 'form_approve_',
    async execute(interaction) {
        const [, customId, targetUserId] = interaction.customId.split('_');
        
        const form = await db.query('SELECT * FROM forms_templates WHERE guild_id = $1 AND custom_id = $2', [interaction.guild.id, customId]);
        if (form.rows.length === 0) return interaction.reply({ content: "Formulário não existe mais.", ephemeral: true });

        const data = form.rows[0];
        const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);

        let statusText = "Aprovado manualmente.";
        
        // Dar Cargo
        if (data.approved_role_id && member) {
            try {
                await member.roles.add(data.approved_role_id);
                statusText += ` Cargo <@&${data.approved_role_id}> adicionado.`;
            } catch (e) {
                statusText += ` (Erro ao dar cargo: Verifique permissões do Bot)`;
            }
        }

        // Atualizar Embed
        const oldEmbed = interaction.message.embeds[0];
        const newEmbed = EmbedBuilder.from(oldEmbed)
            .setColor('#2ECC71') // Verde
            .setDescription(`**Usuário:** <@${targetUserId}>\n**Status:** ✅ Aprovado por <@${interaction.user.id}>\n**Info:** ${statusText}`);

        await interaction.update({ embeds: [newEmbed], components: [] }); // Remove botões
        
        // Tenta avisar o usuário na DM
        if (member) {
            try {
                await member.send(`✅ **Parabéns!** Sua aplicação para **${data.title}** em **${interaction.guild.name}** foi APROVADA!`);
            } catch (e) {}
        }
    }
};