// Crie em: handlers/buttons/store_confirm_delete_.js
const db = require('../../database.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_confirm_delete_',
    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();

        const productId = interaction.customId.split('_').pop();

        try {
            // Deletar do banco
            await db.query('DELETE FROM store_products WHERE id = $1 AND guild_id = $2', [productId, interaction.guild.id]);

            // Mensagem de Sucesso e botão para voltar
            const successUI = [
                {
                    type: 17,
                    components: [
                        { type: 10, content: `> ✅ **Sucesso!** O produto (ID: ${productId}) foi removido permanentemente.` },
                        { type: 14, divider: true, spacing: 1 },
                        {
                            type: 1,
                            components: [{ type: 2, style: 2, label: "Voltar para Lista", emoji: { name: "↩️" }, custom_id: "store_remove_product" }]
                        }
                    ]
                }
            ];

            await interaction.editReply({
                components: successUI,
                flags: V2_FLAG | EPHEMERAL_FLAG
            });

        } catch (error) {
            console.error("Erro ao deletar produto:", error);
            await interaction.followUp({ content: 'Erro ao deletar produto.', ephemeral: true });
        }
    }
};