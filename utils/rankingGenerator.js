const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

// Tente registrar fontes se existirem
try {
    registerFont(path.join(__dirname, '../assets/fonts/Poppins-Bold.ttf'), { family: 'Poppins', weight: 'bold' });
    registerFont(path.join(__dirname, '../assets/fonts/Poppins-Regular.ttf'), { family: 'Poppins', weight: 'regular' });
} catch (e) {}

// --- ÍCONES DE RANK (PNGs DE ALTA QUALIDADE) ---
const RANK_ICONS = {
    1: 'https://cdn-icons-png.flaticon.com/512/2583/2583344.png', // Ouro
    2: 'https://cdn-icons-png.flaticon.com/512/2583/2583319.png', // Prata
    3: 'https://cdn-icons-png.flaticon.com/512/2583/2583434.png', // Bronze
    DEFAULT: 'https://cdn-icons-png.flaticon.com/512/3600/3600407.png' // Bolinha de Natal
};

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

async function generateRanking(data, guildName) {
    const width = 900;
    const height = 850;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // --- 1. FUNDO DE NATAL ---
    // Gradiente Vermelho Festivo
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#8E0E00'); // Vermelho Sangue
    bgGradient.addColorStop(1, '#1F1C18'); // Escuro embaixo
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Efeito de Neve (Círculos brancos translúcidos)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for(let i=0; i<120; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const r = Math.random() * 3.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fill();
    }

    // --- 2. CABEÇALHO ---
    // Título
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 38px "Poppins", "Sans"';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText(`🎅 RANKING DE NATAL: ${guildName.toUpperCase()} 🎅`, width / 2, 70);
    ctx.shadowBlur = 0;

    // Subtítulo
    ctx.fillStyle = '#F1C40F'; // Dourado
    ctx.font = '22px "Poppins", "Sans"';
    ctx.fillText("Quem são os duendes mais trabalhadores?", width / 2, 105);

    // --- 3. LISTA (TOP 10) ---
    let y = 150;
    const rowHeight = 65;

    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const rank = i + 1;

        // Fundo da Linha
        ctx.fillStyle = rank <= 3 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)';
        roundRect(ctx, 50, y, 800, 55, 15, true, false);

        // --- ÍCONE DE RANK (PNG) ---
        // Aqui substituímos as "placas" pelos ícones PNG
        const iconUrl = RANK_ICONS[rank] || RANK_ICONS.DEFAULT;
        try {
            const iconImg = await loadImage(iconUrl);
            ctx.drawImage(iconImg, 30, y - 5, 60, 60); // Ícone saindo um pouco pra fora
        } catch (e) {
            // Fallback se der erro na imagem
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 30px "Poppins"';
            ctx.fillText(`#${rank}`, 60, y + 38);
        }

        // --- AVATAR ---
        const avatarSize = 45;
        const avatarX = 110;
        const avatarY = y + 5;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI*2);
        ctx.closePath();
        ctx.clip();
        try {
            const avatar = await loadImage(item.avatarUrl);
            ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        } catch(e) {
            ctx.fillStyle = '#777';
            ctx.fill();
        }
        ctx.restore();

        // Borda Verde Natalina no Avatar
        ctx.strokeStyle = '#2ecc71'; 
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI*2);
        ctx.stroke();

        // --- NOME (DO SERVIDOR) ---
        ctx.textAlign = 'left';
        ctx.fillStyle = rank === 1 ? '#F1C40F' : '#FFFFFF'; // Top 1 Dourado
        ctx.font = 'bold 24px "Poppins", "Sans"';
        
        // Corta nome se for muito grande
        let displayName = item.displayName || 'Desconhecido';
        if (displayName.length > 22) displayName = displayName.substring(0, 22) + '...';
        
        ctx.fillText(displayName, 170, y + 37);

        // --- TEMPO ---
        ctx.textAlign = 'right';
        ctx.fillStyle = '#2ecc71'; // Verde
        ctx.font = 'bold 22px "Poppins", "Sans"';
        ctx.fillText(item.pointsStr || "0h 0m", 830, y + 37);

        y += rowHeight + 5; // Espaçamento
    }

    // Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '14px "Poppins"';
    ctx.fillText("🎄 Feliz Natal! Continue batendo o ponto para ganhar presentes! 🎁", width/2, height - 20);

    return canvas.toBuffer();
}

module.exports = { generateRanking };