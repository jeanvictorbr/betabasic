const { EmbedBuilder } = require('discord.js');
const dbImport = require('../database');

// LÓGICA DE CORREÇÃO:
// Se o arquivo database.js exporta { pool: ... }, usamos isso.
// Se exporta direto o objeto pool, usamos ele direto.
const pool = dbImport.pool || dbImport;

async function startVerificationLoop(client) {
    console.log('[Verification Loop] Iniciado. Verificando novos usuários...');

    // 1. Migração Automática: Garante que a coluna de controle existe
    try {
        // Tenta conectar. Se falhar aqui, o objeto 'pool' ainda está errado.
        const db = await pool.connect();
        await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE");
        db.release();
        console.log('[Verification Loop] Banco conectado e tabela verificada.');
    } catch (e) { 
        console.error("[Verification Loop] CRÍTICO - Erro ao conectar no Banco:", e.message);
        console.error("Dica: Verifique se o seu arquivo database.js está exportando a 'pool' corretamente.");
        return; // Para o loop se não tiver banco
    }

    // 2. O Loop (Roda a cada 15 segundos)
    setInterval(async () => {
        try {
            const db = await pool.connect();
            
            // Busca usuários que logaram (têm origin_guild) mas ainda não foram processados pelo bot
            const res = await db.query("SELECT * FROM users WHERE origin_guild IS NOT NULL AND processed = FALSE LIMIT 10");

            for (const userRow of res.rows) {
                const { id, origin_guild, username } = userRow;

                try {
                    // A. Verifica se o Bot está na Guilda
                    const guild = client.guilds.cache.get(origin_guild);
                    if (!guild) {
                        // Bot não está na guilda ou guilda inválida, pula (mas não marca processado para tentar depois se o bot entrar)
                         // Opcional: Marcar como processado se quiser ignorar users de servers que o bot nao ta
                        continue; 
                    }

                    // B. Pega a configuração do Cargo
                    const settingsRes = await db.query("SELECT cloudflow_verify_role_id FROM guild_settings WHERE guild_id = $1", [origin_guild]);
                    
                    // Se não tiver config, marca como processado para não travar a fila
                    if (settingsRes.rows.length === 0 || !settingsRes.rows[0].cloudflow_verify_role_id) {
                        await db.query("UPDATE users SET processed = TRUE WHERE id = $1", [id]);
                        continue;
                    }
                    
                    const roleId = settingsRes.rows[0].cloudflow_verify_role_id;

                    // C. Busca o Membro
                    let member;
                    try {
                        member = await guild.members.fetch(id);
                    } catch (e) {
                        // Usuário saiu do servidor ou não entrou ainda
                        continue; 
                    }

                    // D. Dá o Cargo e Manda DM
                    if (member) {
                        // Adiciona Cargo
                        if (!member.roles.cache.has(roleId)) {
                            await member.roles.add(roleId).catch(err => console.error(`[Erro Cargo] ${err.message}`));
                            console.log(`[Verification] Cargo entregue para ${username} em ${guild.name}`);
                        }

                        // Envia DM Rica
                        try {
                            const embed = new EmbedBuilder()
                                .setTitle("🔐 Verificação Concluída!")
                                .setDescription(`Olá **${username}**, sua identidade foi confirmada com sucesso no servidor **${guild.name}**.`)
                                .setColor(0x57F287) // Verde Neon
                                .setThumbnail(guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL())
                                .addFields(
                                    { name: "👤 Usuário", value: `<@${id}>\n(\`${id}\`)`, inline: true },
                                    { name: "📅 Data da Verificação", value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true },
                                    { name: "🛡️ Status", value: "✅ **Acesso Liberado**", inline: false }
                                )
                                .setFooter({ text: "Sistema de Segurança • CloudFlow", iconURL: client.user.displayAvatarURL() })
                                .setTimestamp();

                            await member.send({ embeds: [embed] });
                            console.log(`[Verification] DM enviada para ${username}`);
                        } catch (dmErr) {
                            console.log(`[Verification] DM fechada para ${username}, mas cargo foi entregue.`);
                        }

                        // E. Marca como Processado no Banco (FIM)
                        await db.query("UPDATE users SET processed = TRUE WHERE id = $1", [id]);
                    }
                } catch (innerErr) {
                    console.error(`[Verification] Erro pontual no user ${id}:`, innerErr.message);
                }
            }
            db.release();
        } catch (err) {
            console.error("[Verification Loop] Erro Geral:", err.message);
        }
    }, 15 * 1000); // 15 Segundos
}

module.exports = { startVerificationLoop };