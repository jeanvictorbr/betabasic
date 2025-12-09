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
                const parentCategory = config.category_id ? await guild.channels.fetch(config.category_id).catch(() => newState.channel.parent) : newState.channel.parent;
                
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

                // Mover membro
                await member.voice.setChannel(voiceChannel);

                // --- CORREÇÃO AQUI ---
                // Removido 'created_at' e o 'Date.now()'. O banco usará o DEFAULT NOW().
                await db.query(`
                    INSERT INTO temp_voices (channel_id, guild_id, owner_id)
                    VALUES ($1, $2, $3)
                `, [voiceChannel.id, guild.id, member.id]);
                // ---------------------

                const panelJSON = getVoicePanel({
                    channelName: voiceChannel.name,
                    channelId: voiceChannel.id,
                    ownerId: member.id,
                    isLocked: false,
                    isHidden: false,
                    userLimit: 0
                });

                setTimeout(async () => {
                    await voiceChannel.send({ 
                        content: `👋 Olá <@${member.id}>, aqui está o controle da sua sala.`, 
                        flags: (1 << 15), 
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
        const tempChannelCheck = await db.query(`SELECT * FROM temp_voices WHERE channel_id = $1`, [oldState.channelId]);
        
        if (tempChannelCheck.rows.length > 0) {
            const channel = oldState.channel;
            if (channel && channel.members.size === 0) {
                try {
                    await channel.delete();
                    await db.query(`DELETE FROM temp_voices WHERE channel_id = $1`, [oldState.channelId]);
                } catch (err) {
                    // Ignora erro se canal já foi deletado
                }
            }
        }
    }
};