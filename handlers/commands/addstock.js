const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database.js');
const { parseKK } = require('../../utils/rpCurrency.js');
const updateVitrine = require('../../utils/updateFerrariVitrine.js'); 

module.exports = async (interaction, guildSettings) => {
    const nome = interaction.options.getString('nome');
    
    const embedStart = new EmbedBuilder()
        .setTitle('📦 Configuração de Novo Estoque')
        .setDescription(`Você está adicionando o produto: **${nome}**\n\nO próximo passo é configurar a **Mensagem de Saudação** (aquela que aparece quando o cliente abre o carrinho). Você pode incluir links externos ou **enviar o arquivo da foto junto com o texto**.\n\nClique no botão abaixo quando estiver pronto para digitar a mensagem.`)
        .setColor('#2ECC71');

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('stock_step1').setLabel('Próximo: Mensagem de Saudação').setStyle(ButtonStyle.Primary)
    );

    const response = await interaction.reply({ embeds: [embedStart], components: [row] });

    const collector = response.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 60000 });

    collector.on('collect', async i => {
        if (i.customId === 'stock_step1') {
            await i.update({ content: '✍️ **Envie agora neste chat a mensagem de saudação do produto.** (Se quiser imagem, anexe a foto na mesma mensagem).', embeds: [], components: [] });
            
            const msgCollector = interaction.channel.createMessageCollector({ filter: m => m.author.id === interaction.user.id, max: 1, time: 120000 });
            
            msgCollector.on('collect', async msg => {
                let welcomeMessage = msg.content;
                let imageData = null;
                
                // SÊNIOR: Faz o download da imagem e converte para Base64
                if (msg.attachments.size > 0) {
                    const attachment = msg.attachments.first();
                    try {
                        const res = await fetch(attachment.url);
                        const arrayBuffer = await res.arrayBuffer();
                        imageData = Buffer.from(arrayBuffer).toString('base64');
                    } catch (e) {
                        console.error('Erro ao salvar imagem:', e);
                    }
                }

                await msg.react('📸').catch(()=>{});

                await interaction.followUp({ content: '✅ Saudação e Imagem salvas! Agora, digite a **Quantidade** e o **Preço em KK** separados por espaço. Exemplo: `5 1.5KK`' });

                const mathCollector = interaction.channel.createMessageCollector({ filter: m => m.author.id === interaction.user.id, max: 1, time: 60000 });

                mathCollector.on('collect', async mathMsg => {
                    const args = mathMsg.content.split(' ');
                    const qty = parseInt(args[0]);
                    const priceText = args[1];
                    await mathMsg.delete().catch(()=>{});

                    if(isNaN(qty) || !priceText) {
                        return interaction.followUp('❌ Formato inválido. Use algo como `5 1.5KK`. Cancele e tente novamente.');
                    }

                    const priceParsed = parseKK(priceText);

                    // Salva a mensagem E A IMAGEM CRIPTOGRAFADA no Banco de Dados
                    await db.query(
                        'INSERT INTO ferrari_stock_products (guild_id, name, welcome_message, image_data, quantity, price_kk) VALUES ($1, $2, $3, $4, $5, $6)',
                        [interaction.guildId, nome, welcomeMessage, imageData, qty, priceParsed]
                    );

                    const finalEmbed = new EmbedBuilder()
                        .setTitle('✅ Produto Adicionado com Sucesso!')
                        .addFields(
                            { name: 'Produto', value: nome, inline: true },
                            { name: 'Quantidade', value: qty.toString(), inline: true },
                            { name: 'Preço', value: priceText.toUpperCase(), inline: true }
                        )
                        .setColor('#00ff00');

                    await interaction.followUp({ embeds: [finalEmbed] });

                    await updateVitrine(interaction.client, interaction.guildId);
                });
            });
        }
    });
};