const { ChannelType, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');
const getVoicePanel = require('../ui/voiceControlPanel.js');

module.exports = async (oldState, newState, client) => {
    // 1. Lógica de ENTRAR no canal (Criar Sala)
    if (newState.channelId && (!oldState.channelId || oldState.channelId !== newState.channelId)) {
        const hubConfig = await db.query(`SELECT * FROM voice_hubs WHERE trigger_channel_id = $1`, [newState.channelId]);
        
        if (hubConfig.rows.length > 0) {
            const config = hubConfig.rows[0];
            const guild = newState.guild;
            const member = newState.member;

            try {
                // Tenta pegar a categoria configurada ou a do canal pai
                let parentCategory = newState.channel.parent;
                if (config.category_id) {
                    try {
                        parentCategory = await guild.channels.fetch(config.category_id);
                    } catch (e) {
                        // Se falhar, usa a categoria atual mesmo
                    }
                }
                
                // Cria o canal de voz com permissões explícitas para o BOT
                const voiceChannel = await guild.channels.create({
                    name: `Sala de ${member.user.username}`,
                    type: ChannelType.GuildVoice,
                    parent: parentCategory,
                    permissionOverwrites: [
                        {
                            id: member.id, // Permissão do Dono
                            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers, PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: guild.id, // Permissão do @everyone
                            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: client.user.id, // --- CRUCIAL: Permissão do BOT ---
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect, PermissionFlagsBits.ManageChannels],
                        }
                    ],
                });

                // Mover membro para a sala criada
                if (member.voice.channel) {
                    await member.voice.setChannel(voiceChannel);
                }

                // Inserir no Banco (Sem Data manual, deixa o Default)
                await db.query(`
                    INSERT INTO temp_voices (channel_id, guild_id, owner_id)
                    VALUES ($1, $2, $3)
                `, [voiceChannel.id, guild.id, member.id]);

                // Gerar Painel V2
                const panelJSON = getVoicePanel({
                    channelName: voiceChannel.name,
                    channelId: voiceChannel.id,
                    ownerId: member.id,
                    isLocked: false,
                    isHidden: false,
                    userLimit: 0
                });

                // Enviar Painel (Com verificação extra)
                setTimeout(async () => {
                    try {
                        // Busca o canal novamente para garantir que o cache está atualizado e ele existe
                        const targetChannel = await guild.channels.fetch(voiceChannel.id).catch(() => null);
                        
                        if (targetChannel) {
                            await targetChannel.send({ 
                                content: `👋 Olá <@${member.id}>, configure sua sala abaixo:`, // Menção aqui
                                flags: (1 << 15), // V2 Flag
                                components: panelJSON.components 
                            });
                        }
                    } catch (sendError) {
                        console.error("Erro ao enviar painel na sala temporária:", sendError);
                    }
                }, 2000); // Aumentei levemente o delay para 2s para o Discord processar o chat de voz

            } catch (err) {
                console.error("Erro Crítico ao criar sala temporária:", err);
            }
        }
    }

    // 2. Lógica de SAIR do canal (Deletar se vazio)
    if (oldState.channelId && (!newState.channelId || newState.channelId !== oldState.channelId)) {
        // Verifica se o canal que saiu é uma sala temporária
        try {
            const tempChannelCheck = await db.query(`SELECT * FROM temp_voices WHERE channel_id = $1`, [oldState.channelId]);
            
            if (tempChannelCheck.rows.length > 0) {
                const channel = oldState.channel;
                // Se o canal existe e está vazio (0 pessoas)
                if (channel && channel.members.size === 0) {
                    try {
                        await channel.delete();
                        await db.query(`DELETE FROM temp_voices WHERE channel_id = $1`, [oldState.channelId]);
                    } catch (err) {
                        // Canal já deletado ou erro de permissão
                    }
                }
            }
        } catch (dbError) {
            console.error("Erro ao verificar saída de canal:", dbError);
        }
    }
};