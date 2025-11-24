// Substitua em: handlers/selects/select_store_edit_product.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const db = require('../../database.js');

module.exports = {
    customId: 'select_store_edit_product',
    async execute(interaction) {
        // NÃO use deferUpdate() aqui, senão o modal não abre!
        
        const productId = interaction.values[0];
        if (productId === 'no_result') {
            return interaction.reply({ content: '❌ Nenhuma seleção válida.', ephemeral: true });
        }

        try {
            // 1. Buscar dados do produto
            const product = (await db.query('SELECT * FROM store_products WHERE id = $1', [productId])).rows[0];

            if (!product) {
                return interaction.reply({ content: '❌ Produto não encontrado.', ephemeral: true });
            }

            // 2. Criar o Modal
            // Usamos um ID dinâmico 'store_edit_sub_ID' para saber qual produto salvar depois
            const modal = new ModalBuilder()
                .setCustomId(`store_edit_sub_${product.id}`)
                .setTitle(`Editar: ${product.name.substring(0, 35)}`);

            // 3. Campos do Modal (Máximo 5)
            const inputName = new TextInputBuilder()
                .setCustomId('name')
                .setLabel('Nome do Produto')
                .setStyle(TextInputStyle.Short)
                .setValue(product.name)
                .setMaxLength(100)
                .setRequired(true);

            const inputPrice = new TextInputBuilder()
                .setCustomId('price')
                .setLabel('Preço (ex: 10.50)')
                .setStyle(TextInputStyle.Short)
                .setValue(product.price.toString())
                .setRequired(true);

            const inputStock = new TextInputBuilder()
                .setCustomId('stock')
                .setLabel('Estoque (-1 para infinito)')
                .setStyle(TextInputStyle.Short)
                .setValue(product.stock.toString())
                .setRequired(true);

            const inputDesc = new TextInputBuilder()
                .setCustomId('description')
                .setLabel('Descrição')
                .setStyle(TextInputStyle.Paragraph)
                .setValue(product.description || '')
                .setMaxLength(1000)
                .setRequired(false);

            // Adicionar campos ao modal
            modal.addComponents(
                new ActionRowBuilder().addComponents(inputName),
                new ActionRowBuilder().addComponents(inputPrice),
                new ActionRowBuilder().addComponents(inputDesc),
                new ActionRowBuilder().addComponents(inputStock)
            );

            // 4. Mostrar Modal
            await interaction.showModal(modal);

        } catch (error) {
            console.error("Erro ao abrir modal de edição:", error);
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ Erro ao abrir modal.', ephemeral: true });
            }
        }
    }
};