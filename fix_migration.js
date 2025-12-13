// fix_migration.js
const db = require('./database.js');

(async () => {
    console.log('🔍 [DIAGNÓSTICO] Verificando tabela ticket_departments...');

    try {
        // 1. Verifica qual o tipo atual da coluna no banco
        const check = await db.query(`
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'ticket_departments' AND column_name = 'role_id';
        `);

        if (check.rows.length === 0) {
            console.log('❌ ERRO: A tabela ticket_departments ou a coluna role_id não existe.');
            process.exit(1);
        }

        const tipoAtual = check.rows[0].data_type;
        console.log(`📊 Tipo atual da coluna: ${tipoAtual.toUpperCase()}`);

        if (tipoAtual === 'jsonb') {
            console.log('✅ SUCESSO: A coluna JÁ É do tipo JSONB. O banco está correto!');
        } else {
            console.log('⚠️ AVISO: A coluna NÃO é JSONB. Iniciando conversão forçada...');
            
            // 2. Executa a conversão forçada e limpa dados inválidos se necessário
            await db.query(`
                ALTER TABLE ticket_departments
                ALTER COLUMN role_id TYPE JSONB
                USING CASE
                    -- Se for nulo, vira array vazio
                    WHEN role_id IS NULL THEN '[]'::jsonb
                    -- Se já parecer um array (ex: "[123, 456]"), converte direto
                    WHEN trim(role_id::text) LIKE '[%]' THEN role_id::jsonb
                    -- Se for um ID antigo solto (ex: "123"), coloca dentro de array
                    ELSE jsonb_build_array(role_id)
                END;
            `);
            
            console.log('🚀 CONVERSÃO CONCLUÍDA! Agora a coluna suporta múltiplos cargos.');
        }

    } catch (error) {
        console.error('❌ ERRO FATAL:', error.message);
    } finally {
        // Encerra o processo
        process.exit();
    }
})();