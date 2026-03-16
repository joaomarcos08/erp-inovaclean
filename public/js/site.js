const API_URL = '/api'; // Será consumido via Vercel ou Local

document.addEventListener('DOMContentLoaded', () => {
    carregarCatalogo();
    carregarDestaques();
    carregarEstatisticas();

    // Configurar filtros visuais
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    // Fechar menu mobile ao clicar num link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelector('.nav-links').classList.remove('active');
        });
    });
});

function toggleMenuMobile() {
    document.querySelector('.nav-links').classList.toggle('active');
}

let produtosGlobal = [];

async function carregarCatalogo() {
    const grid = document.getElementById('produtos-vitrine');

    try {
        const response = await fetch(`${API_URL}/site/produtos`);
        const data = await response.json();

        if (data.success && data.produtos && data.produtos.length > 0) {
            produtosGlobal = data.produtos;
            renderizarProdutos(produtosGlobal);
        } else {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <i class="ph-duotone ph-warning-circle" style="font-size: 48px; color: #ffc107;"></i>
                    <p style="margin-top: 10px; font-size: 18px;">Nenhum produto encontrado no catálogo no momento.</p>
                </div>
            `;
        }
    } catch (err) {
        console.error('Erro ao carregar catálogo:', err);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">⏳ Falha ao carregar os produtos. Verifique sua conexão.</p>';
    }
}

function renderizarProdutos(arrayDeProdutos, containerId = 'produtos-vitrine', eDestaque = false) {
    const grid = document.getElementById(containerId);
    grid.innerHTML = '';

    if (arrayDeProdutos.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; margin-top:20px;">Nenhum item corresponde à sua busca.</p>';
        return;
    }

    arrayDeProdutos.forEach(p => {
        let icone = 'ph-package';
        if (p.nome.toLowerCase().includes('papel')) icone = 'ph-toilet-paper';
        if (p.nome.toLowerCase().includes('sab') || p.nome.toLowerCase().includes('detergente')) icone = 'ph-drop';
        if (p.nome.toLowerCase().includes('lixo') || p.nome.toLowerCase().includes('saco')) icone = 'ph-trash';
        if (p.nome.toLowerCase().includes('vassoura') || p.nome.toLowerCase().includes('rodo')) icone = 'ph-broom';

        const valorFloat = parseFloat(p.preco_venda);
        const valorFormatado = isNaN(valorFloat) ? 'Sob Consulta' : `R$ ${valorFloat.toFixed(2)}`;

        let midiaVisual = '';
        if (p.imagem) {
            midiaVisual = `<img src="${p.imagem}" alt="${p.nome}" style="width:100%; height:${eDestaque ? '200px' : '150px'}; object-fit:cover; border-radius:8px; margin-bottom:15px;">`;
        } else {
            midiaVisual = `<i class="ph-duotone ${icone} product-icon" style="font-size: ${eDestaque ? '80px' : '48px'}; margin: 20px 0;"></i>`;
        }

        const tagTop = eDestaque ? `<span style="background:#dc3545; color:white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-bottom:10px; display:inline-block;"><i class="ph-fill ph-fire"></i> MAIS VENDIDO</span>` : '<p class="product-category">Linha Profissional</p>';

        grid.innerHTML += `
            <div class="product-card" ${eDestaque ? 'style="border-color: #ff7f50;"' : ''}>
                ${midiaVisual}
                ${tagTop}
                <h3 class="product-title">${p.nome}</h3>
                <p class="product-price">${valorFormatado} <span style="font-size:12px; color:#888;">/${p.unidade_medida || 'un'}</span></p>
                <button onclick="pedirNoWhatsApp('${p.nome}')" class="btn-primary-large btn-whatsapp">
                    <i class="ph-fill ph-whatsapp-logo" style="font-size: 20px;"></i>
                    Cotar Agora
                </button>
            </div>
        `;
    });
}

function filtrarCatalogoLive() {
    const termo = document.getElementById('live-search-input').value.toLowerCase().trim();
    
    if (!termo) {
        renderizarProdutos(produtosGlobal);
        return;
    }

    const filtrados = produtosGlobal.filter(p => p.nome.toLowerCase().includes(termo));
    renderizarProdutos(filtrados);
    
    // Pequeno scroll elegante se a pessoa começar a digitar estando no cabeçalho
    const catalogoHeader = document.getElementById('catalogo');
    const bottomDaCaixa = document.getElementById('live-search-input').getBoundingClientRect().bottom;
    
    if (bottomDaCaixa > window.innerHeight) {
        catalogoHeader.scrollIntoView({ behavior: 'smooth' });
    }
}

async function carregarDestaques() {
    const grid = document.getElementById('destaques-vitrine');
    try {
        const response = await fetch(`${API_URL}/site/destaques`);
        const data = await response.json();

        if (data.success && data.destaques.length > 0) {
            renderizarProdutos(data.destaques, 'destaques-vitrine', true);
        } else {
            grid.innerHTML = '<p style="text-align: center;">Destaques em processamento...</p>';
        }
    } catch(err) {
        grid.innerHTML = '<p style="color:red;">Erro ao buscar produtos mais vendidos.</p>';
    }
}

async function carregarEstatisticas() {
    try {
        const response = await fetch(`${API_URL}/site/estatisticas`);
        const data = await response.json();

        if (data.success) {
            animarNumeros('contador-clientes', data.clientes, '+');
            animarNumeros('contador-produtos', data.produtos, '+');
        }
    } catch(err) {
        console.error("Falha ao puxar KPIs", err);
    }
}

function animarNumeros(idElemento, alvoTotal, prefixo = '') {
    const el = document.getElementById(idElemento);
    if (!el) return;
    
    let atual = 0;
    const duracao = 2000; // 2 segundos
    const passos = 60; // 60 frames
    const incremento = alvoTotal / passos;
    const tempoFrame = duracao / passos;

    const timer = setInterval(() => {
        atual += incremento;
        if (atual >= alvoTotal) {
            atual = alvoTotal;
            clearInterval(timer);
        }
        el.innerText = prefixo + Math.floor(atual);
    }, tempoFrame);
}

function pedirNoWhatsApp(produtoNome) {
    const telefoneVendedor = '5599999999999'; // Substituir pelo oficial
    const mensagem = encodeURIComponent(`Olá, time da InovaClean! Tenho interesse em adquirir o produto corporativo: *${produtoNome}*. Gostaria de mais informações sobre cotação e volume mínimo.`);
    window.open(`https://wa.me/${telefoneVendedor}?text=${mensagem}`, '_blank');
}

// ================= FORMULÁRIO B2B LEAD =================
async function enviarLead(event) {
    event.preventDefault();
    const nome = document.getElementById('lead-nome').value;
    const cnpj = document.getElementById('lead-cnpj').value;
    const telefone = document.getElementById('lead-telefone').value;

    const btn = event.target.querySelector('button');
    const txtOriginal = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Enviando...';
    btn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/site/contato`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, cnpj, telefone })
        });
        const data = await response.json();

        if (data.success) {
            alert('Recebemos o seu contato! Nossa equipe te chamará no WhatsApp em breve.');
            event.target.reset();
        } else {
            alert('Erro: ' + (data.message || 'Falha ao registrar contato.'));
        }
    } catch (err) {
        alert('Falha de conexão com o servidor.');
    } finally {
        btn.innerHTML = txtOriginal;
        btn.disabled = false;
    }
}

// ================= MODAL B2B LOGIN =================
function abrirModalB2B() {
    document.getElementById('modal-b2b').style.display = 'flex';

    // Se já estiver "logado" na memóira local
    if (localStorage.getItem('b2b_token')) {
        mostrarDashboardB2B(JSON.parse(localStorage.getItem('b2b_cliente') || '{}'));
    } else {
        document.getElementById('b2b-login-area').style.display = 'block';
        document.getElementById('b2b-dashboard-area').style.display = 'none';
        document.getElementById('b2b-cnpj').value = '';
    }

    // Fechar ao clicar fora do modal
    document.getElementById('modal-b2b').onclick = function (event) {
        if (event.target === document.getElementById('modal-b2b')) {
            fecharModalB2B();
        }
    };

    // Fechar ao pressionar a tecla Esc
    document.addEventListener('keydown', fecharComEscB2B);
}

function fecharComEscB2B(event) {
    if (event.key === 'Escape' || event.keyCode === 27) {
        fecharModalB2B();
    }
}

function fecharModalB2B() {
    document.getElementById('modal-b2b').style.display = 'none';
    document.removeEventListener('keydown', fecharComEscB2B);
}

async function fazerLoginB2B() {
    const cnpj = document.getElementById('b2b-cnpj').value.trim();
    if (!cnpj) return alert('Por favor, informe seu CNPJ.');

    try {
        const res = await fetch(`${API_URL}/site/login-b2b`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cnpj })
        });
        const data = await res.json();

        if (data.success && data.token) {
            localStorage.setItem('b2b_token', data.token);
            localStorage.setItem('b2b_cliente', JSON.stringify(data.cliente));
            mostrarDashboardB2B(data.cliente);
        } else {
            alert(data.message || 'CNPJ não encontrado na nossa base.');
        }
    } catch (e) {
        alert('Erro ao tentar conectar com a Área do Cliente.');
    }
}

function sairB2B() {
    localStorage.removeItem('b2b_token');
    localStorage.removeItem('b2b_cliente');
    document.getElementById('b2b-login-area').style.display = 'block';
    document.getElementById('b2b-dashboard-area').style.display = 'none';
}

async function mostrarDashboardB2B(cliente) {
    document.getElementById('b2b-login-area').style.display = 'none';
    document.getElementById('b2b-dashboard-area').style.display = 'block';
    document.getElementById('b2b-nome-cliente').innerHTML = `🏢 ${cliente.nome}`;

    // Buscar pedidos reais
    const tbody = document.getElementById('b2b-lista-pedidos');
    tbody.innerHTML = '<tr><td colspan="4"><i class="ph ph-spinner ph-spin"></i> Buscando faturas...</td></tr>';

    try {
        const token = localStorage.getItem('b2b_token');
        const res = await fetch(`${API_URL}/site/pedidos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.pedidos.length > 0) {
            tbody.innerHTML = '';
            data.pedidos.forEach(p => {
                const dataFormatada = new Date(p.data_venda).toLocaleDateString();
                const totalFormatado = parseFloat(p.valor_total).toFixed(2);

                tbody.innerHTML += `
                    <tr>
                        <td><strong>#INV-${p.id}</strong></td>
                        <td>${dataFormatada}</td>
                        <td style="font-size:12px; color:#555;">(Visualização em breve)</td>
                        <td style="color:#198754; font-weight:600;">R$ ${totalFormatado}</td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhum pedido faturado encontrado.</td></tr>';
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4" style="color:red; text-align:center;">Falha ao carregar pedidos. Erro 500.</td></tr>';
    }
}
