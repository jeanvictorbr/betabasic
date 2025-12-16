const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

// Função auxiliar para quebrar texto (Word Wrap)
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

// Função para desenhar retângulo arredondado
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') {
        stroke = true;
    }
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    if (typeof radius === 'number') {
        radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
        var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
        for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
}

async function generateProfileCard(user, member, flowData, pontoData, socialData, roleTags) {
    const canvas = createCanvas(800, 450);
    const ctx = canvas.getContext('2d');

    // --- 1. FUNDO (BACKGROUND) ---
    // Se o usuário tiver um background comprado/configurado, usa ele.
    // Senão, usa o gradiente padrão dark.
    if (socialData.background_url) {
        try {
            const bg = await loadImage(socialData.background_url);
            // Desenha a imagem cobrindo tudo (Cover mode simples)
            ctx.drawImage(bg, 0, 0, 800, 450);
            
            // Adiciona uma camada escura semi-transparente para o texto ficar legível
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, 800, 450);
        } catch (e) {
            console.log("Erro ao carregar background customizado, usando padrão.");
            // Fallback para gradiente se a imagem quebrar
            const gradient = ctx.createLinearGradient(0, 0, 800, 450);
            gradient.addColorStop(0, '#1a1c20');
            gradient.addColorStop(1, '#000000');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 800, 450);
        }
    } else {
        const gradient = ctx.createLinearGradient(0, 0, 800, 450);
        gradient.addColorStop(0, '#232526');
        gradient.addColorStop(1, '#414345');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 450);
    }

    // Cor Principal baseada no Cargo
    const mainColor = member.displayHexColor === '#000000' ? '#00a8ff' : member.displayHexColor;

    // --- 2. LAYOUT ESTRUTURAL ---
    
    // Avatar Shadow/Glow
    ctx.save();
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(120, 130, 85, 0, Math.PI * 2, true);
    ctx.fillStyle = mainColor; 
    // ctx.fill(); // Opcional: preencher fundo do avatar
    ctx.restore();

    // Avatar Clip & Draw
    try {
        const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatar = await loadImage(avatarURL);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(120, 130, 80, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 40, 50, 160, 160);
        ctx.restore();

        // Borda do Avatar
        ctx.beginPath();
        ctx.arc(120, 130, 80, 0, Math.PI * 2, true);
        ctx.lineWidth = 5;
        ctx.strokeStyle = mainColor;
        ctx.stroke();
    } catch (err) {
        console.error(err);
    }

    // --- 3. INFORMAÇÕES DE TEXTO ---
    
    // Nome do Usuário
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px Sans';
    ctx.fillText(user.username, 230, 90);

    // Cargo Principal
    ctx.fillStyle = mainColor;
    ctx.font = 'bold 24px Sans';
    ctx.fillText(member.roles.highest.name.toUpperCase(), 230, 125);

    // Biografia (Com quebra de linha)
    ctx.fillStyle = '#CCCCCC';
    ctx.font = '18px Sans';
    const bioText = socialData.bio || "Este usuário é misterioso e ainda não definiu uma biografia.";
    wrapText(ctx, bioText, 230, 160, 500, 22);

    // --- 4. CARD DE ESTATÍSTICAS (O "HUD") ---
    
    const startY = 270;
    
    // Fundo do HUD
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    roundRect(ctx, 40, startY, 720, 100, 15, true, false);

    // Divisores
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(280, startY + 15, 2, 70);
    ctx.fillRect(520, startY + 15, 2, 70);

    // Stats Functions
    const drawStat = (label, value, x, color) => {
        ctx.font = 'bold 28px Sans';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.fillText(value, x, startY + 45);
        
        ctx.font = '16px Sans';
        ctx.fillStyle = '#AAAAAA';
        ctx.fillText(label.toUpperCase(), x, startY + 75);
        ctx.textAlign = 'left'; // Reset
    };

    // Formatações
    const coins = flowData?.balance || 0;
    const timeMs = parseInt(pontoData?.total_ms || 0);
    const hours = Math.floor(timeMs / (1000 * 60 * 60));
    const rep = socialData?.reputation || 0;

    drawStat('FlowCoins', `🪙 ${coins.toLocaleString()}`, 160, '#f1c40f');
    drawStat('Horas Totais', `⏱️ ${hours}h`, 400, '#2ecc71');
    drawStat('Reputação', `⭐ ${rep}`, 640, '#9b59b6');

    // --- 5. BADGES / CONQUISTAS ---
    
    // Barra inferior para badges
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 400, 800, 50);
    
    ctx.font = 'bold 16px Sans';
    ctx.fillStyle = '#555';
    ctx.fillText("BADGES:", 20, 430);

    let badgeX = 100;
    if (roleTags && roleTags.length > 0) {
        ctx.font = '24px Sans'; // Emojis ficam maiores
        for (const tag of roleTags) {
            ctx.fillText(tag.tag, badgeX, 432);
            badgeX += 40;
        }
    } else {
        ctx.font = 'italic 14px Sans';
        ctx.fillStyle = '#444';
        ctx.fillText("Nenhuma conquista ainda...", badgeX, 430);
    }

    return canvas.toBuffer();
}

module.exports = { generateProfileCard };