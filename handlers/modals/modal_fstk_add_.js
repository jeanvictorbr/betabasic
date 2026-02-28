const db = require('../../database.js');
const { EmbedBuilder } = require('discord.js');
const updateVitrine = require('../../utils/updateFerrariVitrine.js');

module.exports = {
    customId: 'modal_fstk_add_', 
    execute: async (interaction, guildSettings) => {
        await interaction.deferReply({ ephemeral: true });

        // Extrai a categoria secreta que estava no ID
        const safeCat = interaction.customId.replace('modal_fstk_add_', '');
        const categoria = safeCat.replace(/-/g, ' '); 

        const nome = interaction.fields.getTextInputValue('v_name');
        const preco = interaction.fields.getTextInputValue('v_price');
        const quantidade = interaction.fields.getTextInputValue('v_qty');
        
        // Pega as novas variáveis (se o cara não preencher, fica null)
        const mensagem = interaction.fields.getTextInputValue('v_msg') || null;
        const imagemUrl = interaction.fields.getTextInputValue('v_img') || null;

        let base64Image = null;

        // 🚀 MÁGICA SÊNIOR: Se o cara colou um Link de imagem, o bot baixa e converte pra Base64 pro Site conseguir ler!
        if (imagemUrl && imagemUrl.startsWith('http')) {
            try {
                const response = await fetch(imagemUrl);
                const arrayBuffer = await response.arrayBuffer();
                base64Image = Buffer.from(arrayBuffer).toString('base64');
            } catch (err) {
                console.error('[Add Veículo] Erro ao converter imagem de URL para Base64:', err);
                // Se der erro no link, ele segue o jogo e salva sem imagem.
            }
        }

        // 1. Salva no Banco de Dados
        await db.query(
            'INSERT INTO ferrari_stock_products (guild_id, name, category, price_kk, quantity, welcome_message, image_data) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [interaction.guildId, nome, categoria, preco, quantidade, mensagem, base64Image]
        );

        // 2. Atualiza Vitrines do Discord na hora e avisa o Site
        try {
            await updateVitrine(interaction.client, interaction.guildId);
            if (interaction.client.io) interaction.client.io.emit('estoque_atualizado');
        } catch(e) {}

        // 3. Sistema de Logs (Agora avisa se colocou imagem e msg)
        const logChannelId = guildSettings?.ferrari_log_channel; 
        if (logChannelId) {
            const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
            if (logChannel) {
                const logEmbed = new EmbedBuilder().setTitle('📦 Novo Veículo Cadastrado').setColor('#2ECC71')
                    .addFields(
                        { name: 'Veículo', value: nome, inline: true },
                        { name: 'Categoria', value: categoria, inline: true },
                        { name: 'Estoque / Preço', value: `${quantidade} unid. / R$ ${preco}`, inline: false },
                        { name: 'Saudação Adicionada?', value: mensagem ? '✅ Sim' : '❌ Não', inline: true },
                        { name: 'Imagem Adicionada?', value: base64Image ? '✅ Sim' : '❌ Não', inline: true },
                        { name: 'Staff', value: `<@${interaction.user.id}>`, inline: false }
                    ).setTimestamp();

                // Se tiver imagem válida, joga no log pra ficar bonito
                if (imagemUrl && imagemUrl.startsWith('http')) logEmbed.setThumbnail(imagemUrl);

                await logChannel.send({ embeds: [logEmbed] }).catch(()=>{});
            }
        }

        await interaction.editReply({ content: `✅ O veículo **${nome}** foi adicionado com sucesso em **${categoria}** e as vitrines já atualizaram!` });
    }
};