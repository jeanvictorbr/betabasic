const { ChannelType, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');
const getVoicePanel = require('../ui/voiceControlPanel.js');

module.exports = async (oldState, newState, client) => {
    // 1. Lógica de ENTRAR no canal (Criar Sala)
    if (newState.channelId && (!oldState.channelId || oldState.channelId !== newState.channelId)) {
        // Busca se o canal que ele entrou é um gatilho
        const hubConfig = await db.query(`SELECT * FROM voice_hubs WHERE trigger_channel_id = $1`, [newState.channelId]);
        
        if (hubConfig.rows.length > 0) {
            const config = hubConfig.rows[0];
            const guild = newState.guild;
            const member = newState.member;

            try {
                // Define a categoria (da config ou a mesma do pai)
                const parentCategory = config.category_id ? await guild.channels.fetch(config.category_id).catch(() => newState.channel.parent) : newState.channel.parent;
                
                // Cria o canal de voz
                const voiceChannel = await guild.channels.create({
                    name: `Sala de ${member.user.username}`,
                    type: ChannelType.GuildVoice,
                    parent: parentCategory,
                    permissionOverwrites: [
                        {
                            id: member.id,
                            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers],
                        },
                        {
                            id: guild.id,
                            allow: [PermissionFlagsBits.Connect],
                        },
                    ],
                });

                // Move o usuário imediatamente
                await member.voice.setChannel(voiceChannel);

                // Salva no Banco de Dados
                await db.query(`
                    INSERT INTO temp_voices (channel_id, guild_id, owner_id, created_at)
                    VALUES ($1, $2, $3, $4)
                `, [voiceChannel.id, guild.id, member.id, Date.now()]);

                // Gera o Painel V2
                const panelJSON = getVoicePanel({
                    channelName: voiceChannel.name,
                    channelId: voiceChannel.id,
                    ownerId: member.id,
                    isLocked: false,
                    isHidden: false,
                    userLimit: 0
                });

                // Envia o painel no chat do canal de voz (Recurso nativo do Discord agora)
                // Pequeno delay para o canal registrar corretamente
                setTimeout(async () => {
                    await voiceChannel.send({ 
                        content: `👋 Olá <@${member.id}>, aqui está o controle da sua sala.`, 
                        flags: (1 << 15), // Flag V2 Obrigatória
                        components: panelJSON.components 
                    });
                }, 1500);

            } catch (err) {
                console.error("Erro ao criar sala temporária:", err);
            }
        }
    }

    // 2. Lógica de SAIR do canal (Deletar se vazio)
    if (oldState.channelId && (!newState.channelId || newState.channelId !== oldState.channelId)) {
        // Verifica se o canal que saiu é uma sala temporária
        const tempChannelCheck = await db.query(`SELECT * FROM temp_voices WHERE channel_id = $1`, [oldState.channelId]);
        
        if (tempChannelCheck.rows.length > 0) {
            const channel = oldState.channel;
            // Se o canal existe e está vazio (0 pessoas)
            if (channel && channel.members.size === 0) {
                try {
                    await channel.delete();
                    await db.query(`DELETE FROM temp_voices WHERE channel_id = $1`, [oldState.channelId]);
                } catch (err) {
                    // Ignora erro se o canal já foi deletado manualmente
                }
            }
        }
    }
};