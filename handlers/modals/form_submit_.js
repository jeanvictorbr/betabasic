const db = require('../../database.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    customId: 'form_submit_',
    async execute(interaction) {
        const customId = interaction.customId.split('form_submit_')[1];
        
        const form = await db.query('SELECT * FROM forms_templates WHERE guild_id = $1 AND custom_id = $2', [interaction.guild.id, customId]);
        if (form.rows.length === 0) return interaction.reply({ content: "Formulário não encontrado.", ephemeral: true });

        const data = form.rows[0];
        if (!data.log_channel_id) return interaction.reply({ content: "Erro: Canal de logs não configurado.", ephemeral: true });

        const logChannel = interaction.guild.channels.cache.get(data.log_channel_id);
        if (!logChannel) return interaction.reply({ content: "Erro: Canal de logs não existe mais.", ephemeral: true });

        // Coleta Respostas
        const fields = [];
        data.questions.forEach((q, index) => {
            const answer = interaction.fields.getTextInputValue(`q_${index}`);
            fields.push({ name: q.label, value: answer ? `\`\`\`${answer}\`\`\`` : '*Sem resposta*' });
        });

        // Cria o Dossiê (Embed Tradicional para Logs é melhor)
        const embed = new EmbedBuilder()
            .setColor('#5865F2') // Blurple
            .setTitle(`📄 Nova Submissão: ${data.title}`)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
            .addFields(fields)
            .setFooter({ text: `User ID: ${interaction.user.id}` })
            .setTimestamp();

        // Envia para o canal de logs
        await logChannel.send({ content: `Nova resposta de <@${interaction.user.id}>`, embeds: [embed] });

        await interaction.reply({ content: "✅ **Enviado com sucesso!** Obrigado por preencher.", ephemeral: true });
    }
};