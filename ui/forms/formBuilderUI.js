module.exports = {
    getFormBuilderPanel: (data) => {
        // data: { customId, title, questions, logChannelId }
        
        let questionsText = data.questions.map((q, i) => `**${i+1}.** ${q.label} *(${q.style === 1 ? 'Curto' : 'Longo'})*`).join('\n');
        if (!questionsText) questionsText = "*Nenhuma pergunta definida.*";

        const status = data.logChannelId ? `✅ Logs em <#${data.logChannelId}>` : `⚠️ **Sem canal de logs definido**`;

        return {
            type: 17,
            components: [
                { type: 10, content: `## 🛠️ Editor: ${data.title}`, style: 1 },
                { type: 10, content: `**ID:** \`${data.customId}\`\n${status}`, style: 2 },
                { type: 14, spacing: 1 },
                { type: 10, content: `### Perguntas Atuais (${data.questions.length}/5):\n${questionsText}` },
                { type: 1, components: [
                    { type: 2, style: 1, label: "Adicionar Pergunta", custom_id: `form_add_q_${data.customId}`, emoji: { name: "➕" }, disabled: data.questions.length >= 5 },
                    { type: 2, style: 2, label: "Limpar Perguntas", custom_id: `form_clear_q_${data.customId}`, emoji: { name: "🗑️" } },
                    { type: 2, style: 2, label: "Definir Logs", custom_id: `form_set_log_${data.customId}`, emoji: { name: "📜" } }
                ]}
            ]
        };
    }
};