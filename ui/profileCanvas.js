const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

// Função auxiliar para desenhar retângulo com bordas arredondadas
function drawRoundedRect(ctx, x, y, width, height, radius) {
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
}

// Função auxiliar para quebrar texto (wrap)
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let lineArray = [];

    for(let n = 0; n < words.length; n++) {
        testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lineArray.push([line, x, y]);
            y += lineHeight;
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lineArray.push([line, x, y]);
    return lineArray;
}

module.exports = async (member, profileData, voiceData, repData) => {
    const canvas = createCanvas(800, 450);
    const ctx = canvas.getContext('2d');

    // 1. FUNDO (Tema Personalizado ou Cor Sólida)
    const bgColor = profileData.theme_color || '#5865F2';
    
    // Desenha fundo base
    ctx.fillStyle = '#121212'; // Dark mode base
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Se tiver imagem de fundo personalizada
    if (profileData.theme_image && profileData.theme_image.startsWith('http')) {
        try {
            const bgImage = await loadImage(profileData.theme_image);
            // Desenha imagem preenchendo tudo (cover)
            const ratio = Math.max(canvas.width / bgImage.width, canvas.height / bgImage.height);
            const centerShift_x = (canvas.width - bgImage.width * ratio) / 2;
            const centerShift_y = (canvas.height - bgImage.height * ratio) / 2;
            
            ctx.drawImage(bgImage, 0, 0, bgImage.width, bgImage.height, centerShift_x, centerShift_y, bgImage.width * ratio, bgImage.height * ratio);
            
            // Overlay Escuro para leitura (Blur effect simulado com opacidade)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } catch (e) {
            console.error('Erro ao carregar imagem de fundo:', e);
        }
    }

    // Detalhe lateral com a cor do tema
    ctx.fillStyle = bgColor;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, 15, canvas.height); // Faixa lateral esquerda
    ctx.globalAlpha = 1.0;

    // 2. AVATAR (Redondo com borda do tema)
    const avatarSize = 130;
    const avatarX = 50;
    const avatarY = 50;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    try {
        const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatar = await loadImage(avatarURL);
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    } catch (e) {
        ctx.fillStyle = '#333';
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    }
    ctx.restore();

    // Borda do Avatar
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2, true);
    ctx.lineWidth = 6;
    ctx.strokeStyle = bgColor;
    ctx.stroke();

    // 3. INFORMAÇÕES DO USUÁRIO
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Arial'; // Se tiver fontes customizadas, mude aqui
    ctx.fillText(member.user.username, 210, 85);

    ctx.fillStyle = '#AAAAAA';
    ctx.font = '20px Arial';
    ctx.fillText(`@${member.user.tag} • ID: ${member.id}`, 210, 115);

    // Badge de Data de Entrada
    const joinDate = member.joinedAt.toLocaleDateString('pt-BR');
    ctx.fillStyle = '#CCCCCC';
    ctx.font = '16px Arial';
    ctx.fillText(`Membro desde: ${joinDate}`, 210, 145);

    // 4. BARRA DE XP E NÍVEL (DADOS REAIS)
    // Cálculos
    const currentXp = voiceData.xp || 0;
    const currentLevel = voiceData.level || 0;
    
    // Fórmula inversa para saber XP base do nível atual e do próximo
    // Nivel = sqrt(XP / 50)  -> XP = 50 * Nivel^2
    const xpCurrentLevelBase = 50 * (currentLevel * currentLevel);
    const xpNextLevelBase = 50 * ((currentLevel + 1) * (currentLevel + 1));
    const xpNeededForNext = xpNextLevelBase - xpCurrentLevelBase;
    const xpProgressInLevel = currentXp - xpCurrentLevelBase;
    
    let percentage = xpProgressInLevel / xpNeededForNext;
    if (percentage > 1) percentage = 1;
    if (percentage < 0) percentage = 0;

    // Desenhar Barra
    const barX = 50;
    const barY = 220;
    const barWidth = 700;
    const barHeight = 25;

    // Fundo da barra
    ctx.fillStyle = '#333333';
    drawRoundedRect(ctx, barX, barY, barWidth, barHeight, 10);
    ctx.fill();

    // Preenchimento da barra (Com a cor do tema)
    ctx.fillStyle = bgColor;
    // Garante largura mínima visual se tiver > 0 xp
    const fillWidth = Math.max(percentage * barWidth, currentXp > 0 ? 10 : 0); 
    drawRoundedRect(ctx, barX, barY, fillWidth, barHeight, 10);
    ctx.fill();

    // Textos do Nível
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Nível ${currentLevel}`, barX, barY - 10);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    const xpText = `${Math.floor(xpProgressInLevel)} / ${Math.floor(xpNeededForNext)} XP`;
    const textWidth = ctx.measureText(xpText).width;
    ctx.fillText(xpText, barX + barWidth - textWidth, barY - 10);

    // 5. CAIXA DE BIO
    const boxY = 270;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; // Caixa semi-transparente
    drawRoundedRect(ctx, 50, boxY, 340, 140, 15);
    ctx.fill();

    ctx.fillStyle = bgColor;
    ctx.font = 'bold 18px Arial';
    ctx.fillText('SOBRE MIM', 70, boxY + 30);

    ctx.fillStyle = '#DDDDDD';
    ctx.font = '16px Arial'; // Italic style removed for better readability in canvas
    const bioText = profileData.bio || "Sem bio definida.";
    const bioLines = wrapText(ctx, bioText, 70, boxY + 60, 300, 22);
    
    bioLines.forEach(line => {
        ctx.fillText(line[0], line[1], line[2]);
    });

    // 6. CAIXA DE REPUTAÇÃO / ELOGIOS
    const repBoxX = 410;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    drawRoundedRect(ctx, repBoxX, boxY, 340, 140, 15);
    ctx.fill();

    ctx.fillStyle = '#FFD700'; // Dourado para reputação
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`REPUTAÇÃO: ${repData.count || 0} Elogios`, repBoxX + 20, boxY + 30);

    if (repData.last_message) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px Arial';
        ctx.fillText(`Último de: ${repData.last_author}`, repBoxX + 20, boxY + 60);
        
        ctx.fillStyle = '#AAAAAA';
        ctx.font = 'italic 15px Arial';
        const msgLines = wrapText(ctx, `"${repData.last_message}"`, repBoxX + 20, boxY + 90, 300, 20);
        msgLines.forEach((line, index) => {
            if(index < 2) ctx.fillText(line[0], line[1], line[2]); // Limita a 2 linhas
        });
    } else {
        ctx.fillStyle = '#888888';
        ctx.font = '15px Arial';
        ctx.fillText("Nenhum elogio recebido ainda.", repBoxX + 20, boxY + 70);
    }

    // Retorna o buffer
    return new AttachmentBuilder(canvas.toBuffer(), { name: 'profile-koda.png' });
};