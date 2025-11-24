// Substitua em: handlers/modals/store_edit_sub_.js
const db = require('../../database.js');
const generateEditProductSelectMenu = require('../../ui/store/editProductSelectMenu.js');
const updateStoreVitrine = require('../../utils/updateStoreVitrine.js');
const { PermissionsBitField } = require('discord.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_edit_sub_',
    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();

        const productId = interaction.customId.replace('store_edit_sub_', '');

        // Coletar dados do Modal
        const name = interaction.fields.getTextInputValue('name');
        let price = interaction.fields.getTextInputValue('price').replace(',', '.');
        const description = interaction.fields.getTextInputValue('description');
        const stockTypeInput = interaction.fields.getTextInputValue('stock_type').toUpperCase();
        const roleDurationInput = interaction.fields.getTextInputValue('role_duration');

        // Validações
        if (isNaN(price)) price = 0;
        let roleDuration = parseInt(roleDurationInput);
        if (isNaN(roleDuration)) roleDuration = 0;

        // Validação do Tipo de Estoque
        let stockType = 'GHOST';
        if (stockTypeInput.includes('REAL')) stockType = 'REAL';
        
        // Define o estoque numérico baseado no tipo
        // Se for GHOST, força -1. Se for REAL, mantemos o que já estava no banco (não resetamos estoque real ao editar info)
        // Mas precisamos buscar o estoque atual primeiro.
        
        try {
            // 1. Buscar dados atuais do produto para comparar
            const currentProduct = (await db.query('SELECT * FROM store_products WHERE id = $1', [productId])).rows[0];
            if (!currentProduct) return interaction.followUp({ content: '❌ Produto não encontrado.', ephemeral: true });

            let newStockCount = currentProduct.stock;
            if (stockType === 'GHOST') {
                newStockCount = -1;
            } else if (stockType === 'REAL' && currentProduct.stock === -1) {
                // Se era Ghost e virou Real, iniciamos com 0 para segurança
                newStockCount = 0;
            }

            // 2. Lógica de Cargo (Gerenciamento Avançado)
            let roleIdToGrant = currentProduct.role_id_to_grant;
            let autoCreatedRole = currentProduct.auto_created_role;

            // Se o usuário definiu uma duração (maior que 0)
            if (roleDuration > 0) {
                // Verifica permissões
                if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                    return interaction.followUp({ content: '⚠️ Alterações salvas parcialmente: Não tenho permissão para criar/gerir cargos, então a configuração de cargo foi ignorada.', ephemeral: true });
                }

                // Se o produto ainda não tem cargo, ou tinha mas foi deletado, criamos um novo
                let needsNewRole = !roleIdToGrant;
                if (roleIdToGrant) {
                    const existingRole = await interaction.guild.roles.fetch(roleIdToGrant).catch(() => null);
                    if (!existingRole) needsNewRole = true;
                    else {
                        // Se o cargo existe, atualizamos o nome dele para bater com o novo nome do produto
                        if (existingRole.name !== name && autoCreatedRole) {
                            await existingRole.setName(name).catch(e => console.log("Erro ao renomear cargo:", e));
                        }
                    }
                }

                if (needsNewRole) {
                    try {
                        const newRole = await interaction.guild.roles.create({
                            name: name,
                            reason: `StoreFlow: Cargo temporário para produto ${name}`
                        });
                        roleIdToGrant = newRole.id;
                        autoCreatedRole = true; // Marcamos como criado pelo bot
                    } catch (e) {
                        console.error("Erro ao criar cargo na edição:", e);
                        return interaction.followUp({ content: '❌ Erro ao criar o cargo automático no Discord.', ephemeral: true });
                    }
                }
            } else {
                // Se o usuário colocou duração 0, significa que ele quer remover o cargo
                // Opcional: Deletar o cargo se foi o bot que criou?
                // O prompt pede: "excluir o cargo... quando o produto é adicionado" (no contexto de remover o produto).
                // Aqui apenas desvinculamos.
                roleIdToGrant = null;
                roleDuration = null;
            }

            // 3. Atualizar Banco de Dados
            await db.query(
                `UPDATE store_products 
                 SET name=$1, price=$2, description=$3, stock_type=$4, stock=$5, role_duration_days=$6, role_id_to_grant=$7, auto_created_role=$8
                 WHERE id=$9 AND guild_id=$10`,
                [name, price, description, stockType, newStockCount, roleDuration, roleIdToGrant, autoCreatedRole, productId, interaction.guild.id]
            );

            // 4. Atualizar Vitrine Pública
            try {
                // Chama sem ID de categoria para atualizar tudo onde o produto possa estar
                await updateStoreVitrine(interaction.client, interaction.guild.id); 
            } catch (err) {
                console.error("Erro ao atualizar vitrine:", err);
            }

            // 5. Recarregar Menu do Admin
            const ITEMS_PER_PAGE = 25;
            const countResult = await db.query('SELECT COUNT(*) as count FROM store_products WHERE guild_id = $1', [interaction.guild.id]);
            let totalPages = Math.ceil(parseInt(countResult.rows[0].count) / ITEMS_PER_PAGE) || 1;

            const products = (await db.query(
                'SELECT id, name, price FROM store_products WHERE guild_id = $1 ORDER BY id ASC LIMIT $2 OFFSET 0', 
                [interaction.guild.id, ITEMS_PER_PAGE]
            )).rows;

            const uiComponents = generateEditProductSelectMenu(products, 0, totalPages, false);

            // Feedback
            if (uiComponents[0]?.components?.[0]) {
                const oldContent = uiComponents[0].components[0].content;
                const roleMsg = roleDuration > 0 ? ` (Cargo: ${roleDuration} dias)` : '';
                uiComponents[0].components[0].content = `> ✅ **Editado:** ${name} - R$ ${price}${roleMsg}\n` + oldContent;
            }

            await interaction.editReply({
                components: uiComponents,
                flags: V2_FLAG | EPHEMERAL_FLAG
            });

        } catch (error) {
            console.error("Erro crítico na edição:", error);
            await interaction.followUp({ content: '❌ Erro interno ao processar edição.', ephemeral: true });
        }
    }
};