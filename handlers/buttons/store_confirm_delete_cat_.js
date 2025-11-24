// Crie em: handlers/buttons/store_confirm_delete_cat_.js
const db = require('../../database.js');
const generateCategorySelectMenu = require('../../ui/store/categorySelectMenu.js'); // Reaproveita o menu de seleção para voltar
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_confirm_delete_cat_',
    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();

        const categoryId = interaction.customId.split('_').pop();

        try {
            // 1. Buscar dados da categoria ANTES de deletar (para pegar o ID da mensagem)
            const catResult = await db.query('SELECT * FROM store_categories WHERE id = $1', [categoryId]);
            const category = catResult.rows[0];

            if (category) {
                // 2. APAGAR MENSAGEM DA VITRINE (Se existir)
                if (category.vitrine_channel_id && category.vitrine_message_id) {
                    try {
                        const channel = await interaction.guild.channels.fetch(category.vitrine_channel_id).catch(() => null);
                        if (channel) {
                            const message = await channel.messages.fetch(category.vitrine_message_id).catch(() => null);
                            if (message) {
                                await message.delete();
                                console.log(`[Store] Vitrine da categoria ${category.name} apagada.`);
                            }
                        }
                    } catch (err) {
                        console.error(`[Store] Erro ao apagar mensagem da vitrine (Cat ID: ${categoryId}):`, err);
                        // Não impedimos a exclusão do banco se a mensagem falhar (ex: já foi apagada manualmente)
                    }
                }

                // 3. Desvincular produtos (Segurança: evita produtos presos em categoria fantasma)
                await db.query('UPDATE store_products SET category_id = NULL WHERE category_id = $1', [categoryId]);

                // 4. DELETAR CATEGORIA DO BANCO
                await db.query('DELETE FROM store_categories WHERE id = $1', [categoryId]);
            }

            // 5. Voltar para o menu de remoção (Recarregar lista atualizada)
            const ITEMS_PER_PAGE = 25;
            const countRes = await db.query('SELECT COUNT(*) FROM store_categories WHERE guild_id = $1', [interaction.guild.id]);
            const totalPages = Math.ceil(parseInt(countRes.rows[0].count) / ITEMS_PER_PAGE) || 1;

            const categories = (await db.query(
                'SELECT * FROM store_categories WHERE guild_id = $1 ORDER BY id ASC LIMIT $2 OFFSET 0', 
                [interaction.guild.id, ITEMS_PER_PAGE]
            )).rows;

            // Importante: Precisamos ter certeza que este arquivo UI existe do passo anterior.
            // Se não tiver o arquivo separado, usamos a lógica básica aqui mesmo ou o generateCategorySelectMenu que criamos antes.
            const uiComponents = generateCategorySelectMenu(categories, 0, totalPages, 'remove');

            // Feedback de sucesso
            if (uiComponents[0]?.components?.[0]) {
                uiComponents[0].components[0].content = `> ✅ **Categoria Apagada!** (A vitrine também foi removida se existia).\n> Selecione outra para remover:`;
            }

            await interaction.editReply({
                components: uiComponents,
                flags: V2_FLAG | EPHEMERAL_FLAG
            });

        } catch (error) {
            console.error("Erro ao confirmar delete categoria:", error);
            await interaction.followUp({ content: '❌ Erro ao processar exclusão.', ephemeral: true });
        }
    }
};