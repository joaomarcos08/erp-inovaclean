const API_URL = '/api'; // Será consumido via Vercel ou Local

document.addEventListener('DOMContentLoaded', () => {
    carregarCatalogo();

    // Configurar filtros visuais
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            // Num cenário real teríamos a filtragem aqui
            // Como é um MVP, o clique é apenas visual/UX
        });
    });
});

let produtosGlobal = [];

async function carregarCatalogo() {
    const grid = document.getElementById('produtos-vitrine');

    try {
        // Agora vamos bater num endpoint público que criaremos a seguir
        const response = await fetch(`${API_URL}/site/produtos`);
        const data = await response.json();

        grid.innerHTML = '';

        if (data.success && data.produtos && data.produtos.length > 0) {
            produtosGlobal = data.produtos;

            data.produtos.forEach(p => {
                // Seleciona um icone baseado no nome ou usa default
                let icone = 'ph-package';
                if (p.nome.toLowerCase().includes('papel')) icone = 'ph-toilet-paper';
                if (p.nome.toLowerCase().includes('sab') || p.nome.toLowerCase().includes('detergente')) icone = 'ph-drop';
                if (p.nome.toLowerCase().includes('lixo') || p.nome.toLowerCase().includes('saco')) icone = 'ph-trash';
                if (p.nome.toLowerCase().includes('vassoura') || p.nome.toLowerCase().includes('rodo')) icone = 'ph-broom';

                const valorFloat = parseFloat(p.preco_venda);
                const valorFormatado = isNaN(valorFloat) ? 'Sob Consulta' : `R$ ${valorFloat.toFixed(2)}`;

                grid.innerHTML += `
                    <div class="product-card">
                        <i class="ph-duotone ${icone} product-icon"></i>
                        <p class="product-category">Linha Profissional</p>
                        <h3 class="product-title">${p.nome}</h3>
                        <p class="product-price">${valorFormatado} <span style="font-size:12px; color:#888;">/${p.unidade_medida || 'un'}</span></p>
                        <button onclick="pedirNoWhatsApp('${p.nome}')" class="btn-primary-large btn-whatsapp">
                            <i class="ph-fill ph-whatsapp-logo" style="font-size: 20px;"></i>
                            Cotar Agora
                        </button>
                    </div>
                `;
            });
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
}

function fecharModalB2B() {
    document.getElementById('modal-b2b').style.display = 'none';
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
