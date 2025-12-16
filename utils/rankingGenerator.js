const { createCanvas, loadImage, registerFont } = require('canvas');

// Tente registrar uma fonte se tiver, senão usa a padrão do sistema
try {
    // registerFont('./assets/fonts/Montserrat-Bold.ttf', { family: 'Montserrat Bold' });
} catch (e) {}

// Função auxiliar para cortar texto longo
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

// Função para desenhar texto com gradiente (Para o Top 3)
function drawGradientText(ctx, text, x, y, colorStart, colorEnd, fontSize) {
    ctx.font = `bold ${fontSize}px "Sans"`;
    const gradient = ctx.createLinearGradient(x, y - fontSize, x, y);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    ctx.fillStyle = gradient;
    ctx.fillText(text, x, y);
}

/**
 * Gera a imagem do Ranking Premium V2
 */
async function generateRankingCard(guild, data, page, totalPages) {
    const width = 900;
    const height = 800; // Um pouco mais alto para caber tudo com respiro
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // --- 1. FUNDO E MOLDURA ---
    
    // Fundo Dark Premium
    const bgGradient = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, 600);
    bgGradient.addColorStop(0, '#1a1a2e');
    bgGradient.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Moldura Dourada Brilhante
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, width - 8, height - 8);
    ctx.shadowBlur = 0; // Reset shadow

    // --- 2. CABEÇALHO COM ÍCONE DO SERVIDOR ---
    
    const headerY = 80;
    let textStartX = 50;

    // Desenha Ícone da Guilda (se tiver)
    if (guild.iconURL()) {
        try {
            const guildIcon = await loadImage(guild.iconURL({ extension: 'png', size: 128 }));
            ctx.save();
            ctx.beginPath();
            ctx.arc(80, headerY - 10, 40, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(guildIcon, 40, headerY - 50, 80, 80);
            ctx.restore();
            
            // Borda do ícone
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(80, headerY - 10, 40, 0, Math.PI * 2);
            ctx.stroke();

            textStartX = 140; // Empurra o texto para a direita
        } catch (e) {
            console.error("Erro ao carregar ícone da guilda:", e);
        }
    }

    // Textos do Cabeçalho
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px "Sans"';
    ctx.fillText(shortText(ctx, guild.name.toUpperCase(), 550), textStartX, headerY);

    ctx.fillStyle = '#FFD700'; // Dourado
    ctx.font = '24px "Sans"';
    ctx.fillText(`RANKING DE PONTO • PÁGINA ${page}/${totalPages}`, textStartX, headerY + 35);

    // Divisória
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)'; // Dourado transparente
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, headerY + 60);
    ctx.lineTo(850, headerY + 60);
    ctx.stroke();

    // --- 3. LISTA DE USUÁRIOS (LINHAS) ---
    
    let y = 190;
    const rowHeight = 55;

    for (const item of data) {
        // Fundo da linha (zebra sutil)
        if (item.position % 2 === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.fillRect(20, y - 40, 860, 50);
        }

        // POSIÇÃO (O novo visual sem "placa")
        ctx.textAlign = 'center';
        if (item.position === 1) {
            drawGradientText(ctx, '1', 70, y, '#FFD700', '#FFA500', 42); // Ouro
        } else if (item.position === 2) {
            drawGradientText(ctx, '2', 70, y, '#E0E0E0', '#B0B0B0', 38); // Prata
        } else if (item.position === 3) {
            drawGradientText(ctx, '3', 70, y, '#CD7F32', '#8B4513', 34); // Bronze
        } else {
            ctx.fillStyle = '#666666';
            ctx.font = 'bold 26px "Sans"';
            ctx.fillText(`#${item.position}`, 70, y);
        }
        ctx.textAlign = 'left';

        // AVATAR
        const avatarX = 140;
        if (item.user && item.user.displayAvatarURL) {
            try {
                const img = await loadImage(item.user.displayAvatarURL({ extension: 'png', size: 64 }));
                ctx.save();
                ctx.beginPath();
                ctx.arc(avatarX, y - 12, 22, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(img, avatarX - 22, y - 34, 44, 44);
                ctx.restore();
            } catch (e) {
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(avatarX, y - 12, 22, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // NOME
        ctx.fillStyle = item.position <= 3 ? '#FFFFFF' : '#CCCCCC';
        ctx.font = item.position <= 3 ? 'bold 24px "Sans"' : '22px "Sans"';
        const name = item.user ? item.user.username : 'Desconhecido';
        ctx.fillText(shortText(ctx, name, 380), 190, y);

        // TEMPO (Formatado)
        const totalMs = Math.max(0, parseInt(item.total_ms || 0));
        const hours = Math.floor(totalMs / (1000 * 60 * 60));
        const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
        const timeString = `${hours}h ${minutes}m`;

        // Ícone de relógio + tempo
        ctx.fillStyle = '#4cd137'; // Verde neon
        ctx.font = 'bold 22px "Sans"';
        ctx.textAlign = 'right';
        ctx.fillText(`⏱️ ${timeString}`, 830, y);
        ctx.textAlign = 'left';

        y += rowHeight;
    }

    // --- 4. FOOTER ---
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'italic 14px "Sans"';
    ctx.textAlign = 'center';
    ctx.fillText("BasicFlow System • Atualização em Tempo Real", width / 2, height - 30);

    return canvas.toBuffer();
}

module.exports = { generateRankingCard };