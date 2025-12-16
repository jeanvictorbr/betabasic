const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

// Tenta registrar a fonte (opcional)
try {
    registerFont(path.join(__dirname, '../assets/fonts/Poppins-Bold.ttf'), { family: 'Poppins', weight: 'bold' });
    registerFont(path.join(__dirname, '../assets/fonts/Poppins-Regular.ttf'), { family: 'Poppins', weight: 'regular' });
} catch (e) { }

const ICONS = {
    COIN: 'https://cdn-icons-png.flaticon.com/512/2454/2454269.png',
    REP: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png',
    TIME: 'https://cdn-icons-png.flaticon.com/512/2088/2088617.png'
};

function formatTime(ms) {
    if (!ms) return "0h";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${hours}h`; // Simplificado para caber melhor
}

// Helper para desenhar retângulos arredondados
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') stroke = true;
    if (typeof radius === 'undefined') radius = 5;
    if (typeof radius === 'number') radius = {tl: radius, tr: radius, br: radius, bl: radius};
    else {
        var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
        for (var side in defaultRadius) { radius[side] = radius[side] || defaultRadius[side]; }
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

async function generateProfileCard(targetUser, memberData) {
    const canvas = createCanvas(900, 500);
    const ctx = canvas.getContext('2d');

    // --- 1. FUNDO ---
    let background;
    try {
        if (memberData.social?.background_url) {
            background = await loadImage(memberData.social.background_url);
        } else {
            const grd = ctx.createLinearGradient(0, 0, 900, 500);
            grd.addColorStop(0, '#121212');
            grd.addColorStop(1, '#2c3e50');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 900, 500);
        }
        if (background) ctx.drawImage(background, 0, 0, 900, 500);
    } catch (e) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 900, 500);
    }

    // Overlay Escuro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    roundRect(ctx, 20, 20, 860, 460, 25, true, false);

    // --- 2. AVATAR DO USUÁRIO ---
    const avatarSize = 160;
    const avatarX = 60;
    const avatarY = 60;

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
    
    // Borda Avatar
    ctx.strokeStyle = memberData.highestRoleColor || '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.stroke();

    // --- 3. CARGO MAIOR (Abaixo da foto) ---
    const roleName = memberData.highestRoleName || 'Membro';
    ctx.font = 'bold 18px "Poppins", sans-serif';
    const roleWidth = ctx.measureText(roleName).width + 30;
    const roleX = avatarX + (avatarSize / 2) - (roleWidth / 2);
    const roleY = avatarY + avatarSize + 20;

    ctx.fillStyle = memberData.highestRoleColor || '#555';
    roundRect(ctx, roleX, roleY, roleWidth, 30, 10, true, false);
    
    ctx.fillStyle = '#ffffff'; // Texto branco sempre para contraste
    ctx.textAlign = 'center';
    ctx.fillText(roleName.toUpperCase(), roleX + (roleWidth / 2), roleY + 21);
    ctx.textAlign = 'left'; // Reset

    // --- 4. MEMBRO DESDE (Abaixo do cargo) ---
    const joinedDate = memberData.joinedAt ? new Date(memberData.joinedAt).toLocaleDateString('pt-BR') : '??/??/????';
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '14px "Poppins", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Membro desde:\n${joinedDate}`, avatarX + (avatarSize / 2), roleY + 55);
    ctx.textAlign = 'left'; // Reset

    // --- 5. CABEÇALHO (Nome e Bio) ---
    const textStartX = 280;
    
    // Nome Principal
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px "Poppins", sans-serif';
    const displayName = targetUser.globalName || targetUser.username;
    ctx.fillText(displayName, textStartX, 100);

    // Tag (@usuario)
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '24px "Poppins", sans-serif';
    ctx.fillText(`@${targetUser.username}`, textStartX, 135);

    // Ícone da Guild (Canto Superior Direito)
    if (memberData.guildIconUrl) {
        try {
            const guildIcon = await loadImage(memberData.guildIconUrl);
            const gIconSize = 70;
            const gIconX = 780;
            const gIconY = 50;

            ctx.save();
            ctx.beginPath();
            ctx.arc(gIconX + gIconSize/2, gIconY + gIconSize/2, gIconSize/2, 0, Math.PI*2);
            ctx.clip();
            ctx.drawImage(guildIcon, gIconX, gIconY, gIconSize, gIconSize);
            ctx.restore();
            
            // Borda fina
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(gIconX + gIconSize/2, gIconY + gIconSize/2, gIconSize/2, 0, Math.PI*2);
            ctx.stroke();
        } catch (e) {}
    }

    // Bio
    ctx.fillStyle = '#dddddd';
    ctx.font = 'italic 18px "Poppins", sans-serif';
    const bio = memberData.social?.bio || "Use /social bio para definir sua mensagem personalizada aqui.";
    wrapText(ctx, bio, textStartX, 180, 500, 25);

    // --- 6. STATS BOXES (Ícones PNG) ---
    const statsY = 300;
    const boxWidth = 160;
    const spacing = 20;

    const iconCoin = await loadImage(ICONS.COIN).catch(()=>null);
    const iconRep = await loadImage(ICONS.REP).catch(()=>null);
    const iconTime = await loadImage(ICONS.TIME).catch(()=>null);

    // Box 1: Money
    drawModernStatBox(ctx, iconCoin, 'Saldo', `R$${memberData.flow?.balance || 0}`, textStartX, statsY, '#f1c40f');
    // Box 2: Rep
    drawModernStatBox(ctx, iconRep, 'Reputação', `${memberData.social?.reputation || 0}`, textStartX + boxWidth + spacing, statsY, '#e74c3c');
    // Box 3: Tempo
    drawModernStatBox(ctx, iconTime, 'Online', formatTime(memberData.ponto?.total_ms || 0), textStartX + (boxWidth + spacing) * 2, statsY, '#3498db');

    // --- 7. ÚLTIMAS CONQUISTAS (Badges) ---
    // Área inferior
    const badgeAreaY = 400;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    roundRect(ctx, textStartX, badgeAreaY, 520, 60, 10, true, false);

    ctx.fillStyle = '#888';
    ctx.font = 'bold 12px "Poppins", sans-serif';
    ctx.fillText("CONQUISTAS (TAGS):", textStartX + 10, badgeAreaY + 15);

    let badgeX = textStartX + 10;
    const badges = memberData.badges || [];
    
    if (badges.length === 0) {
        ctx.fillStyle = '#555';
        ctx.font = 'italic 14px "Poppins", sans-serif';
        ctx.fillText("Nenhuma conquista ainda...", badgeX, badgeAreaY + 40);
    } else {
        for (let i = 0; i < Math.min(badges.length, 8); i++) {
            const badge = badges[i];
            // Fundo da Badge
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(badgeX + 20, badgeAreaY + 35, 18, 0, Math.PI*2);
            ctx.fill();
            
            // Emoji
            ctx.font = '20px serif'; // Emoji precisa de fonte padrão as vezes
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(badge.icon || '🏅', badgeX + 20, badgeAreaY + 37);
            
            // Reset
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            badgeX += 45;
        }
    }

    return canvas.toBuffer();
}

function drawModernStatBox(ctx, icon, label, value, x, y, color) {
    // Fundo Gradiente
    const grd = ctx.createLinearGradient(x, y, x + 160, y + 80);
    grd.addColorStop(0, 'rgba(255,255,255,0.05)');
    grd.addColorStop(1, 'rgba(255,255,255,0.01)');
    ctx.fillStyle = grd;
    roundRect(ctx, x, y, 160, 80, 15, true, false);

    // Barra lateral colorida
    ctx.fillStyle = color;
    roundRect(ctx, x, y + 15, 4, 50, 2, true, false);

    // Ícone
    if (icon) {
        ctx.drawImage(icon, x + 15, y + 20, 35, 35);
    } else {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + 32, y + 37, 15, 0, Math.PI*2);
        ctx.fill();
    }

    // Valor
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px "Poppins", sans-serif';
    ctx.fillText(value, x + 60, y + 35);

    // Label
    ctx.fillStyle = '#aaa';
    ctx.font = '12px "Poppins", sans-serif';
    ctx.fillText(label.toUpperCase(), x + 60, y + 55);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let linesDrawn = 0;

    for(let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            if(linesDrawn < 3) { // Limite de 3 linhas para não estourar
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
                linesDrawn++;
            } else {
                line += "..."; // Adiciona reticências se estourar
                break; 
            }
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);
}

module.exports = { generateProfileCard };