const { createCanvas, loadImage } = require('canvas');

// Função para retângulo com bordas arredondadas
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') stroke = true;
    if (typeof radius === 'undefined') radius = 5;
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
    if (stroke) ctx.stroke();
}

// Função para quebra de texto (Bio)
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

// Formatador de números (1.2k)
function abbreviateNumber(value) {
    let newValue = value;
    if (value >= 1000) {
        const suffixes = ["", "k", "m", "b","t"];
        const suffixNum = Math.floor( (""+value).length/3 );
        let shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum)) : value).toPrecision(2));
        if (shortValue % 1 != 0)  shortValue = shortValue.toFixed(1);
        newValue = shortValue+suffixes[suffixNum];
    }
    return newValue;
}

// Efeito de Neve (Mantendo o tema festivo sutil)
function drawSnow(ctx, width, height) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for(let i = 0; i < 50; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 2 + 1;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

async function generateProfileCard(user, member, flowData, pontoData, socialData, roleTags, lastRepUsers = []) {
    const canvas = createCanvas(800, 450);
    const ctx = canvas.getContext('2d');

    // --- 1. BACKGROUND ---
    let bgLoaded = false;
    if (socialData.background_url && socialData.background_url.startsWith('http')) {
        try {
            const bg = await loadImage(socialData.background_url);
            ctx.drawImage(bg, 0, 0, 800, 450);
            bgLoaded = true;
            // Camada escura para leitura
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(0, 0, 800, 450);
        } catch (e) {}
    }

    if (!bgLoaded) {
        // Tema Padrão: Gradiente Elegante Escuro
        const gradient = ctx.createLinearGradient(0, 0, 800, 450);
        gradient.addColorStop(0, '#141E30'); 
        gradient.addColorStop(1, '#243B55');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 450);
        drawSnow(ctx, 800, 450); // Neve sutil
    }

    // Cor Principal baseada no cargo
    const mainColor = member.displayHexColor === '#000000' ? '#5865F2' : member.displayHexColor;

    // --- 2. LAYOUT "CARTÃO SOCIAL" ---
    
    // Painel Esquerdo (Avatar + Info Básica)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    roundRect(ctx, 30, 30, 240, 390, 15, true, true);

    // Avatar (Quadrado arredondado agora, mais moderno)
    const avatarSize = 180;
    const avatarX = 60;
    const avatarY = 60;

    try {
        const avatarURL = member.displayAvatarURL({ extension: 'png', size: 256 });
        const avatar = await loadImage(avatarURL);
        
        ctx.save();
        // Máscara
        ctx.beginPath();
        ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 15);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();

        // Borda do Avatar
        ctx.lineWidth = 3;
        ctx.strokeStyle = mainColor;
        ctx.beginPath();
        ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 15);
        ctx.stroke();
    } catch (err) {}

    // Data de Entrada (Membro Desde)
    const joinedAt = member.joinedAt ? member.joinedAt.toLocaleDateString('pt-BR') : 'N/A';
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '14px Sans';
    ctx.textAlign = 'center';
    ctx.fillText(`Membro desde`, 150, 270);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Sans';
    ctx.fillText(joinedAt, 150, 290);

    // --- 3. PAINEL DIREITO (CONTEÚDO) ---
    const rightX = 300;

    // NICKNAME DO SERVIDOR (Destaque Principal)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 40px Sans';
    // Se o nome for muito grande, diminui a fonte
    let nickName = member.displayName;
    if (nickName.length > 15) ctx.font = 'bold 32px Sans';
    ctx.fillText(nickName, rightX, 80);

    // Tag Real (@usuario)
    ctx.fillStyle = '#888888';
    ctx.font = '18px Sans';
    ctx.fillText(`@${user.username}`, rightX, 110);

    // Divisória
    ctx.fillStyle = mainColor;
    ctx.fillRect(rightX, 125, 400, 2);

    // BIOGRAFIA
    ctx.fillStyle = '#DDDDDD';
    ctx.font = 'italic 18px Sans';
    const bioText = socialData.bio || "Sem status definido. Use /social bio para escrever algo legal aqui!";
    wrapText(ctx, bioText, rightX, 160, 450, 24);

    // --- 4. ESTATÍSTICAS SOCIAIS ---
    
    // Reputação (Destaque Grande)
    const rep = socialData.reputation || 0;
    ctx.font = '40px Sans';
    ctx.fillStyle = '#F1C40F'; // Dourado
    ctx.fillText('⭐', rightX, 260);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Sans';
    ctx.fillText(abbreviateNumber(rep), rightX + 50, 260);
    
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '14px Sans';
    ctx.fillText('REPUTAÇÃO', rightX + 50, 280);

    // Atividade (Horas)
    const timeMs = Math.max(0, parseInt(pontoData?.total_ms || 0));
    const hours = Math.floor(timeMs / (1000 * 60 * 60));
    
    ctx.font = '40px Sans';
    ctx.fillStyle = '#2ECC71'; // Verde
    ctx.fillText('⏱️', rightX + 180, 260);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Sans';
    ctx.fillText(hours + 'h', rightX + 230, 260);

    ctx.fillStyle = '#AAAAAA';
    ctx.font = '14px Sans';
    ctx.fillText('ATIVIDADE', rightX + 230, 280);

    // --- 5. "QUEM ELOGIOU" (SOCIAL ENGAGEMENT) ---
    if (lastRepUsers.length > 0) {
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '12px Sans';
        ctx.fillText('ÚLTIMOS ELOGIOS:', rightX, 320);

        let imgX = rightX;
        for (const u of lastRepUsers) {
            try {
                const uImg = await loadImage(u.displayAvatarURL({ extension: 'png', size: 64 }));
                ctx.save();
                ctx.beginPath();
                ctx.arc(imgX + 20, 350, 20, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(uImg, imgX, 330, 40, 40);
                ctx.restore();
                
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#2f3136'; // Borda escura para separar
                ctx.stroke();

                imgX += 35; // Sobreposição leve (Overlap)
            } catch (e) {}
        }
    }

    // --- 6. BADGES (Rodapé Direito) ---
    if (roleTags && roleTags.length > 0) {
        let badgeX = 750;
        ctx.textAlign = 'right';
        ctx.font = '24px Sans';
        for (const tag of roleTags) {
            ctx.fillText(tag.tag, badgeX, 355);
            badgeX -= 35;
        }
    }

    // --- 7. FLOWCOINS (Discreto no topo direito) ---
    // Badge pequena estilo "Carteira"
    const coins = flowData?.balance || 0;
    const coinText = `🪙 ${abbreviateNumber(coins)}`;
    
    ctx.font = 'bold 16px Sans';
    const coinWidth = ctx.measureText(coinText).width + 20;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    roundRect(ctx, 800 - coinWidth - 20, 20, coinWidth, 30, 15, true, false);
    
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'left';
    ctx.fillText(coinText, 800 - coinWidth - 10, 41);

    // --- RODAPÉ ---
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(30, 400, 740, 2); // Linha fina

    ctx.fillStyle = '#666';
    ctx.font = '12px Sans';
    ctx.textAlign = 'center';
    ctx.fillText(`${member.guild.name.toUpperCase()} • SOCIAL CARD`, 400, 435);

    return canvas.toBuffer();
}

module.exports = { generateProfileCard };