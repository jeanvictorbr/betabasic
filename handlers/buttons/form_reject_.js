const { EmbedBuilder } = require('discord.js');

module.exports = {
    customId: 'form_reject_',
    async execute(interaction) {
        const [, , targetUserId] = interaction.customId.split('_'); // form_reject_ID_USERID

        const oldEmbed = interaction.message.embeds[0];
        const newEmbed = EmbedBuilder.from(oldEmbed)
            .setColor('#E74C3C') // Vermelho
            .setDescription(`**Usuário:** <@${targetUserId}>\n**Status:** ❌ Recusado por <@${interaction.user.id}>`);

        await interaction.update({ embeds: [newEmbed], components: [] });

        // Tenta avisar
        try {
            const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);
            if (member) await member.send(`❌ Sua aplicação em **${interaction.guild.name}** foi recusada.`);
        } catch (e) {}
    }
};