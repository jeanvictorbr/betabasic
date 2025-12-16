const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

// Tente registrar a fonte se ela existir no seu projeto, senão usa sans-serif padrão
try {
    registerFont(path.join(__dirname, '../assets/fonts/Poppins-Bold.ttf'), { family: 'Poppins', weight: 'bold' });
    registerFont(path.join(__dirname, '../assets/fonts/Poppins-Regular.ttf'), { family: 'Poppins', weight: 'regular' });
} catch (e) { /* Fonte não encontrada, usando padrão */ }

// URLs de ícones fixos (PNG) para substituir os emojis feios
const ICONS = {
    COIN: 'https://cdn-icons-png.flaticon.com/512/2454/2454269.png', // Moeda
    REP: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png',  // Estrela
    TIME: 'https://cdn-icons-png.flaticon.com/512/2088/2088617.png', // Relógio
    BADGE_BG: 'https://cdn-icons-png.flaticon.com/512/616/616490.png' // Coroa/Medalha genérica
};

// Função para formatar ms em horas (ex: 12h 30m)
function formatTime(ms) {
    if (!ms) return "0h";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
}

async function generateProfileCard(targetUser, memberData) {
    const canvas = createCanvas(900, 500); // Tamanho ajustado
    const ctx = canvas.getContext('2d');

    // --- 1. FUNDO ---
    // Se o usuário tiver background personalizado, use. Senão, use o tema padrão/natalino
    let background;
    try {
        if (memberData.social?.background_url) {
            background = await loadImage(memberData.social.background_url);
        } else {
            // Fundo padrão gradiente escuro
            const grd = ctx.createLinearGradient(0, 0, 900, 500);
            grd.addColorStop(0, '#121212');
            grd.addColorStop(1, '#1F1F1F');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 900, 500);
        }
        if (background) ctx.drawImage(background, 0, 0, 900, 500);
    } catch (e) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 900, 500);
    }

    // Camada escura semitransparente para melhorar leitura
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(20, 20, 860, 460);

    // --- 2. AVATAR ---
    const avatarSize = 180;
    const avatarX = 60;
    const avatarY = 80;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    
    try {
        const avatar = await loadImage(targetUser.displayAvatarURL({ extension: 'png', size: 512 }));
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    } catch (e) {
        ctx.fillStyle = '#ccc';
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    }
    ctx.restore();

    // Borda do Avatar
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.stroke();

    // --- 3. INFORMAÇÕES DE TEXTO ---
    ctx.fillStyle = '#ffffff';
    
    // Nome Display (Apelido ou Username)
    ctx.font = 'bold 42px "Poppins", sans-serif';
    const displayName = targetUser.globalName || targetUser.username;
    ctx.fillText(displayName, 280, 100);

    // Tag Real (@username) - CORRIGIDO
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '24px "Poppins", sans-serif';
    ctx.fillText(`@${targetUser.username}`, 280, 135);

    // Bio
    ctx.fillStyle = '#dddddd';
    ctx.font = 'italic 20px "Poppins", sans-serif';
    const bio = memberData.social?.bio || "Nenhuma biografia definida.";
    wrapText(ctx, bio, 280, 175, 550, 25);

    // --- 4. ESTATÍSTICAS (Com ícones PNG) ---
    const statsY = 280;
    const statsX = 280;
    const spacing = 180;

    // Ícones carregados
    const iconCoin = await loadImage(ICONS.COIN).catch(() => null);
    const iconRep = await loadImage(ICONS.REP).catch(() => null);
    const iconTime = await loadImage(ICONS.TIME).catch(() => null);

    // Box: Money
    drawStat(ctx, iconCoin, 'Saldo', `R$ ${memberData.flow?.balance || 0}`, statsX, statsY, '#f1c40f');
    
    // Box: Reputação
    drawStat(ctx, iconRep, 'Reputação', `${memberData.social?.reputation || 0}`, statsX + spacing, statsY, '#e74c3c');

    // Box: Tempo de Ponto - CORRIGIDO
    const pontoTime = formatTime(memberData.ponto?.total_ms || 0);
    drawStat(ctx, iconTime, 'Atividade', pontoTime, statsX + (spacing * 2), statsY, '#3498db');

    // --- 5. BADGES/ELOGIOS (Desenhado por último) ---
    // Área de badges na parte inferior
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.roundRect(60, 380, 780, 80, 10); // Container largo
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Poppins", sans-serif';
    ctx.fillText("ÚLTIMAS CONQUISTAS:", 75, 400);

    let badgeX = 80;
    // Pega as badges (cargos ou conquistas)
    const badges = memberData.badges || []; 
    // Desenha apenas as 10 primeiras para caber
    for (let i = 0; i < Math.min(badges.length, 10); i++) {
        const badge = badges[i];
        // Fundo do ícone
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(badgeX + 25, 440, 20, 0, Math.PI * 2);
        ctx.fill();

        // Tenta desenhar ícone (se for texto emoji, usa fillText)
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        // Se badge.icon for URL, teria que carregar imagem, assumindo texto/emoji por enquanto
        // Se for "emojis feios" aqui também, o ideal é mapear para imagens se possível.
        ctx.fillText(badge.icon || '🏅', badgeX + 25, 442); 
        
        // Reseta
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        
        badgeX += 55;
    }

    return canvas.toBuffer();
}

function drawStat(ctx, icon, label, value, x, y, color) {
    if (icon) {
        ctx.drawImage(icon, x, y, 40, 40);
    } else {
        // Fallback círculo colorido se imagem falhar
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + 20, y + 20, 20, 0, Math.PI*2);
        ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Poppins", sans-serif';
    ctx.fillText(value, x + 55, y + 25);

    ctx.fillStyle = color; // Cor do label
    ctx.font = 'bold 14px "Poppins", sans-serif';
    ctx.fillText(label.toUpperCase(), x + 55, y + 45);
}

// Função auxiliar para quebrar texto
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for(let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);
}

module.exports = { generateProfileCard };