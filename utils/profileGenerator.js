const { createCanvas, loadImage } = require('canvas');

/**
 * Utilitário para desenhar retângulos arredondados
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') stroke = true;
    if (typeof radius === 'undefined') radius = 5;
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
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

/**
 * Utilitário para quebra de linha de texto
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for(let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);
}

/**
 * Utilitário para abreviar números (1000 -> 1k)
 */
function abbreviateNumber(value) {
    let newValue = value;
    if (value >= 1000) {
        const suffixes = ["", "k", "m", "b","t"];
        const suffixNum = Math.floor( (""+value).length/3 );
        let shortValue = '';
        for (let precision = 2; precision >= 1; precision--) {
            shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum)) : value).toPrecision(precision));
            var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
            if (dotLessShortValue.length <= 2) { break; }
        }
        if (shortValue % 1 != 0)  shortValue = shortValue.toFixed(1);
        newValue = shortValue+suffixes[suffixNum];
    }
    return newValue;
}

/**
 * Função para desenhar o efeito de neve (Tema Natal)
 */
function drawSnow(ctx, width, height) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    // Desenha 60 flocos aleatórios
    for(let i = 0; i < 60; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 3 + 1;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

async function generateProfileCard(user, member, flowData, pontoData, socialData, roleTags) {
    const canvas = createCanvas(800, 450);
    const ctx = canvas.getContext('2d');

    // --- 1. BACKGROUND (CORREÇÃO & TEMA) ---
    let bgLoaded = false;
    
    // Tenta carregar background do usuário se existir
    if (socialData.background_url && socialData.background_url.startsWith('http')) {
        try {
            const bg = await loadImage(socialData.background_url);
            ctx.drawImage(bg, 0, 0, 800, 450);
            bgLoaded = true;
            
            // Adiciona uma camada escura para o texto ficar legível em qualquer imagem
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, 800, 450);
        } catch (e) {
            console.error("Erro ao carregar background customizado (usando padrão):", e.message);
        }
    }

    // Se não carregou (ou não tem), usa o TEMA DE NATAL PADRÃO
    if (!bgLoaded) {
        // Gradiente Natalino "Noite Mágica"
        const gradient = ctx.createLinearGradient(0, 0, 800, 450);
        gradient.addColorStop(0, '#0f2027'); // Azul noite profundo
        gradient.addColorStop(0.5, '#203a43');
        gradient.addColorStop(1, '#2c5364'); // Azul inverno
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 450);

        // Adiciona Neve
        drawSnow(ctx, 800, 450);
        
        // Faixa Decorativa Vermelha no topo (Fita de presente)
        ctx.fillStyle = '#c0392b'; 
        ctx.fillRect(0, 0, 800, 8);
    }

    // --- 2. PAINEL DE VIDRO (GLASSMORPHISM) ---
    // Cria um painel central translúcido para dar destaque
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    roundRect(ctx, 30, 30, 740, 390, 20, true, true);

    // --- 3. AVATAR ---
    const avatarSize = 140;
    const avatarX = 70;
    const avatarY = 70;

    // Sombra do avatar
    ctx.save();
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Desenho do Avatar
    try {
        const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatar = await loadImage(avatarURL);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();

        // Borda Festiva (Vermelha de Natal)
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#e74c3c'; 
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.stroke();
    } catch (err) {
        console.error("Erro ao desenhar avatar:", err);
    }

    // --- 4. TEXTOS E DETALHES ---
    const textStartX = 250;
    
    // Nome do Usuário
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 38px Sans';
    ctx.fillText(user.username, textStartX, 90);

    // Cargo Principal (Estilo Badge)
    const roleName = member.roles.highest.name.toUpperCase();
    const roleColor = member.displayHexColor === '#000000' ? '#2ecc71' : member.displayHexColor;
    
    ctx.font = 'bold 16px Sans';
    const roleWidth = ctx.measureText(roleName).width + 20;
    
    // Fundo do cargo
    ctx.fillStyle = roleColor;
    roundRect(ctx, textStartX, 108, roleWidth, 24, 6, true, false);
    
    // Texto do cargo
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 2;
    ctx.fillText(roleName, textStartX + 10, 126);
    ctx.shadowBlur = 0; // Reset sombra

    // Biografia
    ctx.fillStyle = '#DDDDDD';
    ctx.font = '18px Sans';
    const bioText = socialData.bio || "Ho Ho Ho! Este usuário ainda não definiu sua biografia de Natal.";
    wrapText(ctx, `"${bioText}"`, textStartX, 165, 480, 24);

    // --- 5. ESTATÍSTICAS (CARDS PREMIUM) ---
    const statsY = 260;
    const cardWidth = 155; // Menores para caberem lado a lado
    const gap = 15;

    const drawStatCard = (x, icon, title, value, color) => {
        // Fundo do card
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        roundRect(ctx, x, statsY, cardWidth, 80, 10, true, false);
        
        // Barra colorida inferior
        ctx.fillStyle = color;
        ctx.fillRect(x, statsY + 76, cardWidth, 4);

        // Ícone
        ctx.font = '28px Sans';
        ctx.fillText(icon, x + 15, statsY + 50);

        // Valor
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px Sans';
        ctx.fillText(value, x + 55, statsY + 35);

        // Título
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '12px Sans';
        ctx.fillText(title.toUpperCase(), x + 55, statsY + 58);
    };

    const coins = flowData?.balance || 0;
    const timeMs = parseInt(pontoData?.total_ms || 0);
    const hours = Math.floor(timeMs / (1000 * 60 * 60));
    const rep = socialData?.reputation || 0;

    // Card 1: FlowCoins (Presente)
    drawStatCard(textStartX, '🎁', 'FlowCoins', abbreviateNumber(coins), '#f1c40f');
    
    // Card 2: Tempo (Árvore)
    drawStatCard(textStartX + cardWidth + gap, '🎄', 'Tempo Total', `${hours}h`, '#2ecc71');
    
    // Card 3: Reputação (Estrela)
    drawStatCard(textStartX + (cardWidth + gap) * 2, '⭐', 'Reputação', abbreviateNumber(rep), '#9b59b6');

    // --- 6. BADGES / CONQUISTAS ---
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    roundRect(ctx, 30, 365, 740, 45, 10, true, false);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Sans';
    ctx.fillText("CONQUISTAS:", 50, 393);

    let badgeX = 160;
    if (roleTags && roleTags.length > 0) {
        ctx.font = '22px Sans';
        for (const tag of roleTags) {
            // Desenha emoji da tag
            ctx.fillText(tag.tag, badgeX, 395);
            badgeX += 35;
        }
    } else {
        ctx.fillStyle = '#888';
        ctx.font = 'italic 14px Sans';
        ctx.fillText("Nenhuma conquista...", badgeX, 393);
    }

    // Marca d'água Natalina
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '12px Sans';
    ctx.textAlign = 'right';
    ctx.fillText("BasicFlow Christmas Edition 🎅", 750, 405);

    return canvas.toBuffer();
}

module.exports = { generateProfileCard };