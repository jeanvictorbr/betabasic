const { createCanvas, loadImage } = require('canvas');

// Função auxiliar para cortar texto
function shortText(ctx, text, maxWidth) {
    let short = text;
    if (ctx.measureText(short).width > maxWidth) {
        while (ctx.measureText(short + '...').width > maxWidth) {
            short = short.slice(0, -1);
        }
        short += '...';
    }
    return short;
}

// Função auxiliar para desenhar retângulos arredondados
function roundRect(ctx, x, y, width, height, radius, fill) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
}

/**
 * Gera a imagem do Ranking
 * @param {Object} guild - Objeto da Guilda
 * @param {Array} data - Array de usuários [{ user, total_ms, position }]
 * @param {Number} page - Página atual (1, 2...)
 * @param {Number} totalPages - Total de páginas
 */
async function generateRankingCard(guild, data, page, totalPages) {
    const width = 900;
    const height = 750; // Altura fixa para 10 itens
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // --- 1. FUNDO ---
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#101214');
    gradient.addColorStop(1, '#181a1d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Detalhe de fundo
    ctx.fillStyle = '#1e2124';
    ctx.fillRect(850, 0, 50, height); // Faixa lateral

    // --- 2. CABEÇALHO ---
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 40px Sans';
    ctx.fillText(`🏆 Ranking de Ponto`, 40, 60);

    ctx.fillStyle = '#AAAAAA';
    ctx.font = '20px Sans';
    ctx.fillText(`${guild.name.toUpperCase()} • PÁGINA ${page}/${totalPages}`, 40, 95);

    // Linha divisória
    ctx.strokeStyle = '#2f3136';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 115);
    ctx.lineTo(800, 115);
    ctx.stroke();

    // --- 3. LISTA DE USUÁRIOS ---
    let y = 140;
    const rowHeight = 55;

    for (const item of data) {
        const isTop3 = item.position <= 3;
        
        // Fundo da linha (alternado)
        if (item.position % 2 !== 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            roundRect(ctx, 30, y - 35, 800, 50, 10, true);
        }

        // Cor do Rank (#)
        let rankColor = '#777777';
        let badge = null;

        if (item.position === 1) { rankColor = '#FFD700'; badge = '🥇'; }
        else if (item.position === 2) { rankColor = '#C0C0C0'; badge = '🥈'; }
        else if (item.position === 3) { rankColor = '#CD7F32'; badge = '🥉'; }

        // Desenha Posição
        ctx.fillStyle = rankColor;
        ctx.font = 'bold 28px Sans';
        ctx.textAlign = 'center';
        const posText = badge ? badge : `#${item.position}`;
        ctx.fillText(posText, 70, y);
        ctx.textAlign = 'left';

        // Avatar
        if (item.user && item.user.displayAvatarURL) {
            try {
                const avatarURL = item.user.displayAvatarURL({ extension: 'png', size: 64 });
                const img = await loadImage(avatarURL);
                ctx.save();
                ctx.beginPath();
                ctx.arc(140, y - 10, 20, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(img, 120, y - 30, 40, 40);
                ctx.restore();
            } catch (e) {
                // Falha silenciosa no avatar, desenha bolinha cinza
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(140, y - 10, 20, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Nome
        ctx.fillStyle = isTop3 ? '#FFFFFF' : '#DDDDDD';
        ctx.font = isTop3 ? 'bold 24px Sans' : '22px Sans';
        const name = item.user ? item.user.username : 'Usuário Saiu';
        ctx.fillText(shortText(ctx, name, 350), 180, y);

        // Tempo Formatado
        const totalMs = Math.max(0, parseInt(item.total_ms || 0));
        const hours = Math.floor(totalMs / (1000 * 60 * 60));
        const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
        const timeString = `${hours}h ${minutes}m`;

        ctx.fillStyle = '#2ecc71'; // Verde Ponto
        ctx.font = 'bold 22px Sans';
        ctx.textAlign = 'right';
        ctx.fillText(timeString, 800, y);
        ctx.textAlign = 'left';

        y += rowHeight;
    }

    // --- 4. FOOTER ---
    ctx.fillStyle = '#444';
    ctx.font = 'italic 16px Sans';
    ctx.textAlign = 'center';
    ctx.fillText("BasicFlow System • Atualizado em tempo real", 450, 730);

    return canvas.toBuffer();
}

module.exports = { generateRankingCard };