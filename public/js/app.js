const API_URL = '/api';

// Variáveis de estado globais
window.filtroDataInicio = null;
window.filtroDataFim = null;
window.carrinho = [];
window.usuarioLogado = null;

// Atalho do Enter
window.handleLoginEnter = function (event) {
    if (event.key === 'Enter' || event.keyCode === 13) {
        event.preventDefault();
        fazerLogin();
    }
};

// ============ AUTENTICAÇÃO ============
window.fazerLogin = async function () {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    if (!email || !senha) {
        alert('Email e senha são obrigatórios');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message || 'Erro ao fazer login');
            return;
        }

        // Salva token e dados do usuário
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        window.usuarioLogado = data.usuario;

        // Mostra dashboard
        document.getElementById('login-area').style.display = 'none';
        document.getElementById('dashboard-area').style.display = 'block';
        document.getElementById('btn-logout').style.display = 'block'; // Show logout button

        // Carrega dados do dashboard
        await carregarDashboard();

        const cargoNormalizado = data.usuario.cargo ? data.usuario.cargo.toLowerCase() : '';
        if (cargoNormalizado === 'admin' || cargoNormalizado === 'administrador') {
            document.getElementById('btn-tab-equipe').style.display = 'inline-block';
            document.getElementById('btn-tab-dre').style.display = 'inline-block';
            carregarUsuarios();
        } else {
            document.getElementById('btn-tab-equipe').style.display = 'none';
            document.getElementById('btn-tab-dre').style.display = 'none';
        }

        window.alternarAba('dashboard');

        alert(`Bem-vindo, ${data.usuario.nome}!`);
    } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao conectar com o servidor');
    }
};

window.fazerLogout = function () {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.usuarioLogado = null;
    document.getElementById('login-area').style.display = 'block';
    document.getElementById('dashboard-area').style.display = 'none';
    document.getElementById('btn-logout').style.display = 'none'; // Hide logout button
    document.getElementById('email').value = '';
    document.getElementById('senha').value = '';
};

window.logout = function () {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.reload();
};

// ============ INICIALIZAÇÃO ============ //
window.initApp = async function () {
    const token = localStorage.getItem('token');
    const usuarioStr = localStorage.getItem('usuario');

    if (token && usuarioStr) {
        try {
            const usuario = JSON.parse(usuarioStr);
            window.usuarioLogado = usuario;

            // Altera visualização logo de início
            document.getElementById('login-area').style.display = 'none';
            document.getElementById('dashboard-area').style.display = 'block';
            document.getElementById('btn-logout').style.display = 'block';

            // Carrega os dados
            await carregarDashboard();

            // Configurações e acessos de Admin
            const cargoNormalizado = usuario.cargo ? usuario.cargo.toLowerCase() : '';
            if (cargoNormalizado === 'admin' || cargoNormalizado === 'administrador') {
                document.getElementById('btn-tab-equipe').style.display = 'inline-block';
                document.getElementById('btn-tab-dre').style.display = 'inline-block';
                carregarUsuarios();
            } else {
                document.getElementById('btn-tab-equipe').style.display = 'none';
                document.getElementById('btn-tab-dre').style.display = 'none';
            }

            window.alternarAba('dashboard');
        } catch (e) {
            console.error('Sessão armazenada corrompida. Fazendo logout automático...', e);
            window.fazerLogout();
        }
    }
};

// ============ NAVEGAÇÃO EM ABAS ============
window.alternarAba = function (nomeAba) {
    // 1. Remove classe ativa dos botoes
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));

    // 2. Oculta todos os conteudos de abas
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('tab-active'));

    // 3. Adiciona classe ativa ao botao e a aba clicada
    const btnId = `btn-tab-${nomeAba}`;
    const abaId = `aba-${nomeAba}`;

    const btn = document.getElementById(btnId);
    if (btn) btn.classList.add('active');

    const aba = document.getElementById(abaId);
    if (aba) aba.classList.add('tab-active');

    // 4. Se for o historico, garantimos que atualiza caso uma venda tenha sido feita
    if (nomeAba === 'historico') {
        carregarHistorico();
    } else if (nomeAba === 'dashboard') {
        carregarDashboard();
    } else if (nomeAba === 'financeiro') {
        carregarFinanceiro();
    } else if (nomeAba === 'dre') {
        const dataAtual = new Date();
        const mesAtual = (dataAtual.getMonth() + 1).toString();
        const anoAtual = dataAtual.getFullYear().toString();

        // Seta default pro mes atual se os inputs estiverem vazios no HTML
        if (!document.getElementById('dre-mes').value) {
            document.getElementById('dre-mes').value = mesAtual;
        }
        if (!document.getElementById('dre-ano').value) {
            document.getElementById('dre-ano').value = anoAtual;
        }

        carregarDadosDRE();
    }
};

// ============ DRE ============
window.carregarDadosDRE = async function () {
    const token = localStorage.getItem('token');
    const mes = document.getElementById('dre-mes').value;
    const ano = document.getElementById('dre-ano').value;

    if (!mes || !ano) {
        alert("Selecione o mês e o ano para gerar o DRE.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/relatorios/dre?mes=${mes}&ano=${ano}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.error || data.message || "Erro ao buscar dados do DRE");
            return;
        }

        const formatarReal = (valor) => {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
        };

        document.getElementById('dre-receita').innerText = formatarReal(data.receita_bruta);
        document.getElementById('dre-cmv').innerText = formatarReal(data.cmv);
        document.getElementById('dre-lucro-bruto').innerText = formatarReal(data.lucro_bruto);
        document.getElementById('dre-despesas').innerText = formatarReal(data.despesas);
        document.getElementById('dre-lucro-liquido').innerText = formatarReal(data.lucro_liquido);

    } catch (err) {
        console.error('Erro ao carregar DRE:', err);
        alert('Erro ao carregar dados do DRE');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.initApp();
});

// ============ CLIENTES ============
window.cadastrarCliente = async function () {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Você precisa estar logado');
        return;
    }

    const nome = document.getElementById('cli-nome').value;
    const cnpj = document.getElementById('cli-cnpj').value;
    const tipo = document.getElementById('cli-tipo').value;
    const cidade = document.getElementById('cli-cidade').value;
    const estado = document.getElementById('cli-estado').value;

    if (!nome || !cnpj) {
        alert('Nome e CNPJ são obrigatórios');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/clientes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nome, cnpj, tipo, cidade, estado })
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message || 'Erro ao cadastrar cliente');
            return;
        }

        alert('Cliente cadastrado com sucesso!');
        document.getElementById('cli-nome').value = '';
        document.getElementById('cli-cnpj').value = '';
    } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao cadastrar cliente');
    }
};

// ============ PRODUTOS ============
window.cadastrarProduto = async function () {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Você precisa estar logado');
        return;
    }

    const nome = document.getElementById('prod-nome').value;
    const categoria = document.getElementById('prod-categoria').value;
    const custo = document.getElementById('prod-custo').value;
    const venda = document.getElementById('prod-venda').value;
    const estoque = document.getElementById('prod-estoque-inicial').value;

    if (!nome || !custo || !venda) {
        alert('Nome, custo e preço de venda são obrigatórios');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/produtos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                nome,
                categoria_id: categoria,
                preco_custo: parseFloat(custo),
                preco_venda: parseFloat(venda),
                estoque_inicial: parseInt(estoque) || 0
            })
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message || 'Erro ao cadastrar produto');
            return;
        }

        alert('Produto cadastrado com sucesso!');
        document.getElementById('prod-nome').value = '';
        document.getElementById('prod-custo').value = '';
        document.getElementById('prod-venda').value = '';
        document.getElementById('prod-estoque-inicial').value = '';
    } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao cadastrar produto');
    }
};

// ============ VENDAS ============

// ============ FILTROS ============
window.aplicarFiltros = async function () {
    const inicio = document.getElementById('filtro-inicio').value;
    const fim = document.getElementById('filtro-fim').value;

    if (!inicio || !fim) {
        alert("Selecione o período completo.");
        return;
    }

    // Salva o filtro globalmente para que outras funções não o apaguem
    window.filtroDataInicio = inicio;
    window.filtroDataFim = fim;

    console.log("Solicitando filtro:", inicio, "até", fim);
    await carregarHistorico(inicio, fim);
};

window.limparFiltros = async function () {
    document.getElementById('filtro-inicio').value = '';
    document.getElementById('filtro-fim').value = '';
    window.filtroDataInicio = null;
    window.filtroDataFim = null;
    await carregarHistorico();
};

// Agora a função usa os filtros globais como padrão
async function carregarHistorico(inicio = window.filtroDataInicio, fim = window.filtroDataFim) {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();

    // Se houver filtro salvo, ele será usado automaticamente
    if (inicio && fim && inicio !== "" && inicio !== "undefined") {
        params.append('inicio', inicio);
        params.append('fim', fim);
    }

    const url = `${API_URL}/vendas/historico?${params.toString()}`;
    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    let vendas = [];
    if (data.success && Array.isArray(data.vendas)) {
        vendas = data.vendas;
    } else if (Array.isArray(data)) {
        vendas = data;
    }

    const corpo = document.getElementById('lista-historico-vendas');
    corpo.innerHTML = '';

    if (!vendas || vendas.length === 0) {
        corpo.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhuma venda encontrada no período.</td></tr>';
        return;
    }

    vendas.forEach(v => {
        const dataF = new Date(v.data_venda).toLocaleString('pt-BR');
        corpo.innerHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;">${v.id}</td>
                <td>${dataF}</td>
                <td>${v.cliente}</td>
                <td>R$ ${parseFloat(v.valor_total).toFixed(2)}</td>
                <td>${v.forma_pagamento || '-'}</td>
                <td><span style="background:${v.status === 'Cancelada' ? '#dc3545' : '#28a745'}; color:white; padding:3px 8px; border-radius:12px; font-size:12px;">${v.status || 'Concluída'}</span></td>
                <td style="text-align: center; white-space: nowrap;">
                    <button onclick="reimprimirVenda(${v.id})" style="background:#17a2b8; color:white; border:none; padding:5px; border-radius:4px;">📄</button>
                    ${v.status !== 'Cancelada' ? `<button onclick="cancelarVenda(${v.id})" style="background:#dc3545; color:white; border:none; padding:5px; border-radius:4px; margin-left:5px;">❌</button>` : ''}
                </td>
            </tr>`;
    });
}

// Imprimir/Reimprimir Venda
window.reimprimirVenda = async function (id, isAutoPrint = false) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/vendas/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (!data.success) {
            if (!isAutoPrint) alert('Venda não encontrada ou erro ao carregar dados.');
            return;
        }

        const venda = data.venda;
        const itens = data.itens;

        let itensHtml = '';
        itens.forEach(item => {
            itensHtml += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px;">
                    <span>${item.quantidade}x ${item.nome.substring(0, 15)}</span>
                    <span>R$ ${(item.quantidade * item.preco_unitario).toFixed(2)}</span>
                </div>
            `;
        });

        const html = `
            <p style="text-align: center; font-size: 12px; margin: 0 0 10px 0;"><strong>Comprovante de Venda Não Fiscal</strong></p>
            <p style="margin: 2px 0;"><strong>Venda Nº:</strong> ${venda.id}</p>
            <p style="margin: 2px 0;"><strong>Data:</strong> ${new Date(venda.data_venda).toLocaleString('pt-BR')}</p>
            <p style="margin: 2px 0;"><strong>Cliente:</strong> ${venda.cliente}</p>
            <p style="margin: 2px 0;"><strong>Pagamento:</strong> ${venda.forma_pagamento || 'Dinheiro'}</p>
            <hr style="border-top: 1px dashed #000; my-2">
            <strong>Itens:</strong>
            ${itensHtml}
            <hr style="border-top: 1px dashed #000; my-2">
            <div class="total-container">
                <span>TOTAL:</span>
                <span>R$ ${parseFloat(venda.valor_total).toFixed(2)}</span>
            </div>
        `;

        const containerConteudo = document.getElementById('comprovante-conteudo');
        if (containerConteudo) {
            containerConteudo.innerHTML = html;
            // Executa a impressão
            setTimeout(() => {
                window.print();
            }, 500);
        }
    } catch (err) {
        console.error('Erro ao gerar comprovante:', err);
    }
};

// Cancelar/Devolver venda
window.cancelarVenda = async function (id) {
    if (!confirm('Deseja realmente CANCELAR esta venda? Isso devolverá os produtos ao estoque e estornará o controle financeiro.')) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/vendas/${id}/cancelar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            alert('Venda cancelada com sucesso!');
            carregarHistorico();
            carregarProdutos();
            carregarSaldoDia();
        } else {
            alert(data.message || 'Erro ao cancelar');
        }
    } catch (err) {
        console.error(err);
        alert('Erro ao se conectar ao servidor');
    }
};

// ============ DASHBOARD ============
window.carregarDashboard = async function () {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        await Promise.all([
            carregarProdutos(),
            carregarClientes(),
            carregarLucroMensal(),
            carregarHistorico(),
            carregarVendasHoje(),
            carregarFaturamentoMensal(),
            carregarEstoqueMinimo(),
            carregarSugestaoCompra(),
            carregarClientesInativos(),
            carregarSaldoDia(),
            carregarCompromissosHoje(),
            carregarOrcamentos(),
            carregarFornecedores()
        ]);
    } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
    }
};

// Carrega produtos para a tabela e selects
window.carregarProdutos = async function () {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/produtos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        const produtos = Array.isArray(data) ? data : (data.produtos || []);

        // Preenche tabela de edição
        const tbody = document.getElementById('corpo-tabela-produtos');
        tbody.innerHTML = '';

        produtos.forEach(p => {
            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">${p.id}</td>
                    <td>${p.nome}</td>
                    <td>R$ ${parseFloat(p.preco_venda).toFixed(2)}</td>
                    <td>${p.estoque_atual || 0} unm</td>
                    <td>
                        <button onclick="reporEstoque(${p.id}, '${p.nome}')"
                            style="background:#28a745; color:white; border:none; padding:5px; border-radius:4px; margin-right:5px;">📥 Repor Estoque</button>
                        <button onclick="abrirEdicao(${p.id}, '${p.nome}', ${p.preco_venda}, ${p.preco_custo}, ${p.estoque_minimo})" 
                            style="background:#ffc107; color:black; border:none; padding:5px; border-radius:4px; margin-right:5px;">✏️ Editar</button>
                        <button onclick="deletarProduto(${p.id})" 
                            style="background:#dc3545; color:white; border:none; padding:5px; border-radius:4px;">🗑️ Deletar</button>
                    </td>
                </tr>`;
        });

        // Preenche select de produtos
        const selectProdutos = document.getElementById('select-produtos');
        const selectPedProdutos = document.getElementById('ped-produto-id');

        if (selectProdutos) selectProdutos.innerHTML = '<option value="">-- Selecione um produto --</option>';
        if (selectPedProdutos) selectPedProdutos.innerHTML = '<option value="">-- Selecione o Produto --</option>';

        produtos.forEach(p => {
            if (selectProdutos) {
                const optionVenda = document.createElement('option');
                optionVenda.value = p.id;
                optionVenda.textContent = `${p.nome} - R$ ${parseFloat(p.preco_venda).toFixed(2)}`;
                selectProdutos.appendChild(optionVenda);
            }
            if (selectPedProdutos) {
                const optionCompra = document.createElement('option');
                optionCompra.value = p.id;
                optionCompra.textContent = `${p.nome} (Atual: ${p.estoque_atual || 0})`;
                selectPedProdutos.appendChild(optionCompra);
            }
        });

    } catch (err) {
        console.error('Erro ao carregar produtos:', err);
    }
};

// Carrega clientes para a venda
window.carregarClientes = async function () {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/clientes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        const clientes = Array.isArray(data) ? data : (data.clientes || []);

        const selectClientes = document.getElementById('select-clientes');
        selectClientes.innerHTML = '<option value="">-- Selecione um cliente --</option>';

        const tbodyClientes = document.getElementById('corpo-tabela-clientes');
        tbodyClientes.innerHTML = '';

        clientes.forEach(c => {
            // Options pro select de vendas
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.nome;
            selectClientes.appendChild(option);

            // Linhas para a tabela de edição
            tbodyClientes.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">${c.id}</td>
                    <td>${c.nome}</td>
                    <td>${c.cnpj || '-'}</td>
                    <td>${c.tipo || '-'}</td>
                    <td>
                        <button onclick="abrirEdicaoCliente(${c.id}, '${c.nome}', '${c.cnpj || ''}', '${c.tipo || ''}', '${c.cidade || ''}', '${c.estado || ''}')" 
                            style="background:#ffc107; color:black; border:none; padding:5px; border-radius:4px;">✏️ Editar</button>
                    </td>
                </tr>`;
        });

    } catch (err) {
        console.error('Erro ao carregar clientes:', err);
    }
};

// Carrega lucro mensal
window.carregarLucroMensal = async function () {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/dashboard/lucro-mensal`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        const lucro = data.lucro || 0;

        document.getElementById('lucro-mensal').textContent = `R$ ${parseFloat(lucro).toFixed(2)}`;
    } catch (err) {
        console.error('Erro ao carregar lucro:', err);
        document.getElementById('lucro-mensal').textContent = 'R$ 0,00';
    }
};

// Carrega vendas do dia
window.carregarVendasHoje = async function () {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/dashboard/vendas-hoje`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        const total = data.total || 0;

        document.getElementById('vendas-hoje').textContent = `R$ ${parseFloat(total).toFixed(2)}`;
    } catch (err) {
        console.error('Erro ao carregar vendas hoje:', err);
        document.getElementById('vendas-hoje').textContent = 'R$ 0,00';
    }
};

// Carrega saldo do dia (Vendas - Despesas)
window.carregarSaldoDia = async function () {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/dashboard/saldo-dia`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const saldo = data.saldo_liquido || 0;
        document.getElementById('saldo-dia').textContent = `R$ ${parseFloat(saldo).toFixed(2)}`;
    } catch (err) {
        console.error('Erro ao carregar saldo do dia:', err);
        document.getElementById('saldo-dia').textContent = 'R$ 0,00';
    }
};

// Carrega compromissos que vencem hoje
window.carregarCompromissosHoje = async function () {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/dashboard/compromissos-hoje`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const lista = document.getElementById('lista-compromissos');
        lista.innerHTML = '';

        if (data.compromissos && data.compromissos.length > 0) {
            data.compromissos.forEach(comp => {
                lista.innerHTML += `
                    <li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">
                        <span>${comp.descricao} - <strong>R$ ${parseFloat(comp.valor).toFixed(2)}</strong></span>
                        <button onclick="pagarDespesa(${comp.id})" style="background: #28a745; padding: 4px 8px; font-size: 12px;">✔️ Pagar</button>
                    </li>`;
            });
        } else {
            lista.innerHTML = '<li style="color: #28a745;">Nenhum compromisso pendente para hoje! 🎉</li>';
        }
    } catch (err) {
        console.error('Erro ao carregar compromissos:', err);
    }
};

// Carrega faturamento mensal
window.carregarFaturamentoMensal = async function () {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/dashboard/faturamento-mensal`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        const total = data.total || 0;

        document.getElementById('faturamento-mensal').textContent = `R$ ${parseFloat(total).toFixed(2)}`;
    } catch (err) {
        console.error('Erro ao carregar faturamento:', err);
        document.getElementById('faturamento-mensal').textContent = 'R$ 0,00';
    }
};

// Carrega alerta de estoque mínimo
window.carregarEstoqueMinimo = async function () {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/dashboard/estoque-critico`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        const produtos = data.produtos || [];

        const lista = document.getElementById('lista-estoque');
        lista.innerHTML = '';

        if (produtos.length === 0) {
            lista.innerHTML = '<li>✅ Todos os produtos com estoque normal</li>';
            return;
        }

        produtos.forEach(p => {
            lista.innerHTML += `<li>⚠️ ${p.nome}: ${p.estoque} unidades (mínimo: ${p.estoque_minimo})</li>`;
        });

    } catch (err) {
        console.error('Erro ao carregar estoque:', err);
    }
};

// Carrega Sugestão de Compra
window.carregarSugestaoCompra = async function () {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/dashboard/sugestao-compra`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        const sugestoes = data.sugestoes || [];

        const lista = document.getElementById('lista-sugestao-compra');
        if (!lista) return;
        lista.innerHTML = '';

        if (sugestoes.length === 0) {
            lista.innerHTML = '<li>✅ Nenhuma previsão de ruptura iminente.</li>';
            return;
        }

        sugestoes.forEach(p => {
            lista.innerHTML += `<li>🛒 ${p.nome}: ${p.estoque_atual} unid. (Comprar ao atingir ${p.estoque_minimo})</li>`;
        });

    } catch (err) {
        console.error('Erro ao carregar sugestões de compra:', err);
    }
};

// Carrega Clientes Inativos (> 30 dias em Bacabal)
window.carregarClientesInativos = async function () {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/dashboard/clientes-inativos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        const inativos = data.inativos || [];

        const tbody = document.getElementById('corpo-tabela-inativos');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (inativos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 15px;">✅ Todos os clientes de Bacabal estão ativos recentemente!</td></tr>';
            return;
        }

        inativos.forEach(c => {
            const dataUltima = c.ultima_compra ? new Date(c.ultima_compra).toLocaleDateString('pt-BR') : 'Nunca Comprou';
            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">${c.id}</td>
                    <td>${c.nome}</td>
                    <td style="color: #dc3545; font-weight: bold;">${dataUltima}</td>
                </tr>
            `;
        });

    } catch (err) {
        console.error('Erro ao carregar clientes inativos:', err);
    }
};
// ============ GRÁFICOS (CHART.JS) ============
let chartFaturamentoVar = null;
let chartCategoriasVar = null;

window.carregarGraficos = async function (dataInicio = null, dataFim = null) {
    const token = localStorage.getItem('token');
    if (!token) return;

    let queryParams = '';
    if (dataInicio && dataFim) {
        queryParams = `?dataInicio=${dataInicio}&dataFim=${dataFim}`;
    }

    try {
        // Busca os dados da semana
        const resFaturamento = await fetch(`${API_URL}/dashboard/faturamento-semana${queryParams}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataFaturamento = await resFaturamento.json();

        // Busca categorias
        const resCategorias = await fetch(`${API_URL}/dashboard/vendas-categoria${queryParams}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataCategorias = await resCategorias.json();

        // Renderiza Gráfico de Linha (Tendência Semanal)
        if (dataFaturamento.success) {
            const ctxLinear = document.getElementById('chart-faturamento').getContext('2d');
            if (chartFaturamentoVar) chartFaturamentoVar.destroy();

            chartFaturamentoVar = new Chart(ctxLinear, {
                type: 'line',
                data: {
                    labels: dataFaturamento.labels,
                    datasets: [{
                        label: 'Vendas (R$)',
                        data: dataFaturamento.data,
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Renderiza Gráfico de Pizza (Vendas por Categoria)
        if (dataCategorias.success) {
            const ctxPizza = document.getElementById('chart-categorias').getContext('2d');
            if (chartCategoriasVar) chartCategoriasVar.destroy();

            chartCategoriasVar = new Chart(ctxPizza, {
                type: 'doughnut',
                data: {
                    labels: dataCategorias.categorias,
                    datasets: [{
                        data: dataCategorias.quantidades,
                        backgroundColor: [
                            '#28a745', '#17a2b8', '#ffc107', '#dc3545', '#6f42c1', '#e83e8c'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right' }
                    }
                }
            });
        }
    } catch (err) {
        console.error('Erro ao carregar gráficos:', err);
    }
};

window.aplicarFiltrosGraficos = function () {
    const inicio = document.getElementById('filtro-grafico-inicio').value;
    const fim = document.getElementById('filtro-grafico-fim').value;

    if (!inicio || !fim) {
        alert('Por favor, selecione as datas de Início e Fim para filtrar os gráficos.');
        return;
    }

    if (new Date(inicio) > new Date(fim)) {
        alert('A data de início não pode ser maior que a data de fim.');
        return;
    }

    carregarGraficos(inicio, fim);
};

// Abre modal de edição
window.abrirEdicao = function (id, nome, venda, custo, minimo) {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-nome').value = nome;
    document.getElementById('edit-nome-titulo').textContent = nome;
    document.getElementById('edit-venda').value = venda;
    document.getElementById('edit-custo').value = custo;
    document.getElementById('edit-minimo').value = minimo;
    document.getElementById('modal-edicao').style.display = 'block';
};

// Salva edição do produto
window.salvarEdicao = async function () {
    const token = localStorage.getItem('token');
    const id = document.getElementById('edit-id').value;
    const nome = document.getElementById('edit-nome').value;
    const venda = document.getElementById('edit-venda').value;
    const custo = document.getElementById('edit-custo').value;
    const minimo = document.getElementById('edit-minimo').value;

    try {
        const response = await fetch(`${API_URL}/produtos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                nome,
                preco_venda: parseFloat(venda),
                preco_custo: parseFloat(custo),
                estoque_minimo: parseInt(minimo)
            })
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message || 'Erro ao salvar alterações');
            return;
        }

        alert('Produto atualizado com sucesso!');
        document.getElementById('modal-edicao').style.display = 'none';
        await carregarProdutos();
    } catch (err) {
        console.error('Erro ao salvar produto:', err);
        alert('Erro ao salvar alterações');
    }
};

// ============ EDIÇÃO DE CLIENTES ============
window.abrirEdicaoCliente = function (id, nome, cnpj, tipo, cidade, estado) {
    document.getElementById('edit-cli-id').value = id;
    document.getElementById('edit-cli-nome').value = nome;
    document.getElementById('edit-cli-nome-titulo').textContent = nome;
    document.getElementById('edit-cli-cnpj').value = cnpj;

    const tipoSelect = document.getElementById('edit-cli-tipo');
    tipoSelect.value = tipo;
    if (!tipoSelect.value) tipoSelect.value = 'Outro'; // Fallback

    document.getElementById('edit-cli-cidade').value = cidade;
    document.getElementById('edit-cli-estado').value = estado;

    document.getElementById('modal-edicao-cliente').style.display = 'block';
};

window.salvarEdicaoCliente = async function () {
    const token = localStorage.getItem('token');
    const id = document.getElementById('edit-cli-id').value;
    const nome = document.getElementById('edit-cli-nome').value;
    const cnpj = document.getElementById('edit-cli-cnpj').value;
    const tipo = document.getElementById('edit-cli-tipo').value;
    const cidade = document.getElementById('edit-cli-cidade').value;
    const estado = document.getElementById('edit-cli-estado').value;

    try {
        const response = await fetch(`${API_URL}/clientes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nome, cnpj, tipo, cidade, estado })
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message || 'Erro ao atualizar cliente');
            return;
        }

        alert('Cliente atualizado com sucesso!');
        document.getElementById('modal-edicao-cliente').style.display = 'none';
        await carregarClientes();
    } catch (err) {
        console.error('Erro ao atualizar cliente:', err);
        alert('Falha interna ao tentar atualizar cliente');
    }
};
// Deleta produto
window.deletarProduto = async function (id) {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/produtos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message || 'Erro ao deletar produto');
            return;
        }

        alert('Produto deletado com sucesso!');
        await carregarProdutos();
    } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao deletar produto');
    }
};

// Repor Estoque
window.reporEstoque = async function (produtoId, produtoNome) {
    const qtde = prompt(`Quantas unidades de "${produtoNome}" estão entrando no estoque?`);
    if (!qtde) return; // cancelou

    const quantidade = parseInt(qtde);
    if (isNaN(quantidade) || quantidade <= 0) {
        alert("Quantidade inválida. Insira um número maior que zero.");
        return;
    }

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/produtos/entrada`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                produto_id: produtoId,
                quantidade: quantidade,
                motivo: 'Reposição manual de estoque'
            })
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message || 'Erro ao registrar entrada de mercadoria');
            return;
        }

        alert('Estoque atualizado com sucesso!');
        await carregarProdutos();
        await carregarEstoqueMinimo(); // Atualiza também os alertas
    } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao processar reposição de estoque');
    }
};

// Adiciona item ao carrinho
window.adicionarAoCarrinho = async function () {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Você precisa estar logado');
        return;
    }

    const clienteId = document.getElementById('select-clientes').value;
    const produtoId = document.getElementById('select-produtos').value;
    const quantidade = parseInt(document.getElementById('qtd-venda').value);

    if (!clienteId || !produtoId || quantidade < 1) {
        alert('Selecione cliente, produto e quantidade válida');
        return;
    }

    // Busca informações do produto
    try {
        const response = await fetch(`${API_URL}/produtos/${produtoId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const produto = await response.json();

        const item = {
            id: window.carrinho.length + 1,
            produtoId: produtoId,
            produtoNome: produto.nome,
            preco: produto.preco_venda,
            quantidade: quantidade,
            subtotal: produto.preco_venda * quantidade
        };

        window.carrinho.push(item);

        // Atualiza lista visual do carrinho
        atualizarCarrinho();

        document.getElementById('qtd-venda').value = '1';
        document.getElementById('select-produtos').value = '';

    } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao adicionar item');
    }
};

// Atualiza a visualização do carrinho
window.atualizarCarrinho = function () {
    const lista = document.getElementById('carrinho-lista');
    const btnFinalizar = document.getElementById('btn-finalizar');
    const btnOrcamento = document.getElementById('btn-orcamento');

    lista.innerHTML = '';
    let total = 0;

    window.carrinho.forEach((item, index) => {
        total += item.subtotal;
        lista.innerHTML += `
            <li style="padding: 10px; background: #f9f9f9; margin: 5px 0; border-radius: 4px;">
                ${item.produtoNome} x${item.quantidade} = R$ ${item.subtotal.toFixed(2)}
                <button onclick="removerDoCarrinho(${index})" style="background:#dc3545; color:white; border:none; padding:3px 8px; border-radius:3px; cursor:pointer; float:right;">Remover</button>
            </li>`;
    });

    if (window.carrinho.length > 0) {
        lista.innerHTML += `<li style="font-weight:bold; padding: 10px;">Total: R$ ${total.toFixed(2)}</li>`;
        if (btnFinalizar) btnFinalizar.classList.remove('d-none');
        if (btnOrcamento) btnOrcamento.classList.remove('d-none');
        const fp = document.getElementById('forma-pagamento');
        if (fp) fp.classList.remove('d-none');
    } else {
        if (btnFinalizar) btnFinalizar.classList.add('d-none');
        if (btnOrcamento) btnOrcamento.classList.add('d-none');
        const fp = document.getElementById('forma-pagamento');
        if (fp) fp.classList.add('d-none');
    }
};

// Remove item do carrinho
window.removerDoCarrinho = function (index) {
    window.carrinho.splice(index, 1);
    atualizarCarrinho();
};

// Finaliza venda
window.finalizarVenda = async function () {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Você precisa estar logado');
        return;
    }

    if (window.carrinho.length === 0) {
        alert('Carrinho vazio');
        return;
    }

    const clienteId = document.getElementById('select-clientes').value;

    if (!clienteId) {
        alert('Selecione um cliente');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/vendas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                cliente_id: clienteId,
                forma_pagamento: document.getElementById('forma-pagamento') ? document.getElementById('forma-pagamento').value : 'Dinheiro',
                itens: window.carrinho.map(item => ({
                    produto_id: item.produtoId,
                    quantidade: item.quantidade,
                    preco_unitario: item.preco
                }))
            })
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message || 'Erro ao finalizar venda');
            return;
        }

        alert('Venda finalizada com sucesso!');

        reimprimirVenda(data.venda.id, true);

        window.carrinho = [];
        atualizarCarrinho();
        document.getElementById('select-clientes').value = '';

        await Promise.all([
            carregarProdutos(),
            carregarHistorico(),
            carregarVendasHoje(),
            carregarFaturamentoMensal()
        ]);

    } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao finalizar venda');
    }
};

// ============ ORÇAMENTOS ============
window.salvarOrcamento = async function () {
    const token = localStorage.getItem('token');
    if (!token) return alert('Você precisa estar logado');

    if (window.carrinho.length === 0) return alert('Carrinho vazio');

    const clienteId = document.getElementById('select-clientes').value;
    if (!clienteId) return alert('Selecione um cliente');

    try {
        const response = await fetch(`${API_URL}/orcamentos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                cliente_id: clienteId,
                itens: window.carrinho.map(item => ({
                    produto_id: item.produtoId,
                    quantidade: item.quantidade,
                    preco_unitario: item.preco
                }))
            })
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message || 'Erro ao salvar orçamento');
            return;
        }

        alert('Orçamento guardado e salvo para posterioridade! 📑');
        window.carrinho = [];
        atualizarCarrinho();
        document.getElementById('select-clientes').value = '';

        await carregarOrcamentos();

    } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao salvar orçamento');
    }
};

window.carregarOrcamentos = async function () {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/orcamentos/historico`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.success) return;

        const tbody = document.getElementById('corpo-tabela-orcamentos');
        tbody.innerHTML = '';

        data.orcamentos.forEach(o => {
            const rowData = new Date(o.data_orcamento).toLocaleDateString();
            const corStatus = o.status === 'Convertido' ? '#28a745' : (o.status === 'Cancelado' ? '#dc3545' : '#ffc107');

            let btnAcoes = `<button onclick="gerarPdfOrcamento(${o.id})" style="background: #17a2b8; padding:5px 8px; font-size:12px;">📄 PDF</button>`;

            if (o.status === 'Pendente') {
                btnAcoes += ` <button onclick="converterOrcamentoEmVenda(${o.id})" style="background: #28a745; padding:5px 8px; font-size:12px;">✅ Converter em Venda</button>`;
            }

            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding:10px;">#${o.id}</td>
                    <td>${rowData}</td>
                    <td>${o.cliente}</td>
                    <td style="font-weight:bold;">R$ ${parseFloat(o.valor_total).toFixed(2)}</td>
                    <td><span style="background:${corStatus}; color:${o.status === 'Pendente' ? '#000' : '#fff'}; padding:3px 8px; border-radius:12px; font-size:12px;">${o.status}</span></td>
                    <td>${btnAcoes}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error('Erro ao carregar orçamentos:', err);
    }
};

window.converterOrcamentoEmVenda = async function (id) {
    if (!confirm('Deseja converter este orçamento numa venda real? O estoque será abatido agora.')) return;

    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`${API_URL}/orcamentos/${id}/converter`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        if (data.success) {
            alert('Sucesso! Orçamento fechado e transformado numa venda real. 🛒');
            await Promise.all([
                carregarOrcamentos(),
                carregarHistorico(),
                carregarProdutos(),
                carregarVendasHoje(),
                carregarFaturamentoMensal(),
                carregarSaldoDia()
            ]);
        } else {
            alert(data.message || 'Erro ao converter');
        }
    } catch (err) {
        console.error(err);
        alert('Erro de conexão com o servidor.');
    }
};

window.gerarPdfOrcamento = async function (id) {
    const token = localStorage.getItem('token');

    try {
        // Busca os dados completos deste orçamento
        const res = await fetch(`${API_URL}/orcamentos/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.success) return alert('Erro ao buscar orçamento');

        const orc = data.orcamento;
        const itens = data.itens;

        // Preenche o template
        document.getElementById('pdf-orc-id').textContent = orc.id.toString().padStart(4, '0');
        document.getElementById('pdf-orc-data').textContent = new Date(orc.data_orcamento).toLocaleDateString();
        document.getElementById('pdf-cli-nome').textContent = orc.cliente;
        document.getElementById('pdf-cli-cnpj').textContent = orc.cnpj || 'Não Registado';
        document.getElementById('pdf-cli-local').textContent = `${orc.cidade || 'Bacabal'} - ${orc.estado || 'MA'}`;

        const tbodyHtml = itens.map(item => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;">${item.quantidade}</td>
                <td style="padding: 10px;">${item.unidade_medida || 'UN'}</td>
                <td style="padding: 10px;">${item.nome}</td>
                <td style="padding: 10px; text-align: right;">R$ ${parseFloat(item.preco_unitario).toFixed(2)}</td>
                <td style="padding: 10px; text-align: right;">R$ ${(item.quantidade * item.preco_unitario).toFixed(2)}</td>
            </tr>
        `).join('');

        document.getElementById('pdf-itens-corpo').innerHTML = tbodyHtml;
        document.getElementById('pdf-orc-total').textContent = parseFloat(orc.valor_total).toFixed(2);

        // Exibe temporariamente para o html2pdf capturar
        const element = document.getElementById('orcamento-pdf-template');
        element.style.display = 'block';

        // Opções do PDF
        const opt = {
            margin: 10,
            filename: `Orcamento_InovaClean_${orc.id}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Gera o PDF
        html2pdf().set(opt).from(element).save().then(() => {
            // Esconde novamente
            element.style.display = 'none';
        });

    } catch (err) {
        console.error(err);
        alert('Erro ao gerar o documento PDF');
    }
};

// Exportar para Excel
window.exportarExcel = function () {
    const table = document.querySelector('table');
    let html = '<table border="1">';

    table.querySelectorAll('tr').forEach(row => {
        html += '<tr>';
        row.querySelectorAll('th, td').forEach(cell => {
            if (!cell.textContent.includes('Ação') && !cell.textContent.includes('PDF')) {
                html += `<td>${cell.textContent}</td>`;
            }
        });
        html += '</tr>';
    });

    html += '</table>';

    const elemento = document.createElement('a');
    elemento.href = 'data:application/vnd.ms-excel,' + encodeURIComponent(html);
    elemento.download = `vendas_${new Date().toISOString().split('T')[0]}.xls`;
    elemento.click();
};

window.toggleFormNovoUsuario = function () {
    const form = document.getElementById('form-novo-usuario');
    if (form.style.display === 'none') {
        form.style.display = 'block';
    } else {
        form.style.display = 'none';
        // Limpa campos ao fechar
        document.getElementById('novo-user-nome').value = '';
        document.getElementById('novo-user-email').value = '';
        document.getElementById('novo-user-senha').value = '';
        document.getElementById('novo-user-cargo').value = 'vendedor';
    }
};

// ============ USUÁRIOS (ADMIN) ============
window.cadastrarMembroEquipe = async function () {
    const nome = document.getElementById('novo-user-nome').value;
    const email = document.getElementById('novo-user-email').value;
    const senha = document.getElementById('novo-user-senha').value;
    const cargo = document.getElementById('novo-user-cargo').value;

    if (!nome || !email || !senha || !cargo) {
        alert('Preencha todos os campos!');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha, cargo })
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message || 'Erro ao criar usuário');
            return;
        }

        alert('Usuário cadastrado com sucesso!');
        document.getElementById('novo-user-nome').value = '';
        document.getElementById('novo-user-email').value = '';
        document.getElementById('novo-user-senha').value = '';
        document.getElementById('novo-user-cargo').value = 'vendedor';

        carregarUsuarios(); // recarrega a tabela imediatamente
        toggleFormNovoUsuario(); // Oculta o formulário de volta
    } catch (err) {
        console.error(err);
        alert('Erro ao cadastrar usuário');
    }
};

window.carregarUsuarios = async function () {
    const token = localStorage.getItem('token');
    if (!token || !window.usuarioLogado || window.usuarioLogado.cargo !== 'admin') return;

    try {
        const response = await fetch(`${API_URL}/usuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        const tbody = document.getElementById('lista-equipe');
        tbody.innerHTML = '';

        if (data.success && data.usuarios) {
            data.usuarios.forEach(u => {
                const isCurrent = u.id === window.usuarioLogado.id;
                tbody.innerHTML += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px;">${u.id}</td>
                        <td>${u.nome} ${isCurrent ? '(Você)' : ''}</td>
                        <td>${u.email}</td>
                        <td>
                            <select onchange="atualizarCargo(${u.id}, this.value)" ${isCurrent ? 'disabled' : ''} style="padding: 5px; width: auto; margin:0; height: auto;">
                                <option value="admin" ${u.cargo === 'admin' ? 'selected' : ''}>Admin</option>
                                <option value="vendedor" ${u.cargo === 'vendedor' ? 'selected' : ''}>Vendedor</option>
                            </select>
                        </td>
                        <td>
                            <button onclick="deletarUsuario(${u.id})" 
                                ${isCurrent ? 'disabled style="background:#ccc; cursor:not-allowed; border:none; padding:5px; border-radius:4px; margin: 2px;"' : 'style="background:#dc3545; color:white; border:none; padding:5px; border-radius:4px; margin: 2px;"'}
                                >🗑️ Excluir</button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (err) {
        console.error('Erro ao carregar usuários:', err);
    }
};

window.atualizarCargo = async function (id, novoCargo) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/usuarios/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cargo: novoCargo })
        });
        const data = await response.json();
        if (!data.success) {
            alert(data.message || 'Erro ao atualizar cargo');
            carregarUsuarios(); // revert
        } else {
            alert('Cargo atualizado com sucesso!');
        }
    } catch (err) {
        console.error(err);
        alert('Erro ao atualizar cargo');
        carregarUsuarios();
    }
};

window.deletarUsuario = async function (id) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/usuarios/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!data.success) {
            alert(data.message || 'Erro ao deletar usuário');
        } else {
            alert('Usuário deletado!');
            carregarUsuarios();
        }
    } catch (err) {
        console.error(err);
        alert('Erro ao excluir usuário');
    }
};

// ============ FINANCEIRO ============ //
window.abrirModalFinanceiro = function (tipo) {
    document.getElementById('fin-tipo').value = tipo;
    document.getElementById('modal-financeiro-titulo').innerHTML = `➕ Nova ${tipo}`;
    document.getElementById('modal-financeiro-border').style.borderTopColor = tipo === 'Receita' ? '#28a745' : '#dc3545';
    document.getElementById('btn-salvar-fin').style.backgroundColor = tipo === 'Receita' ? '#28a745' : '#dc3545';
    document.getElementById('modal-financeiro').style.display = 'block';
};

window.salvarLancamentoFinanceiro = async function () {
    const token = localStorage.getItem('token');
    const tipo = document.getElementById('fin-tipo').value;
    const descricao = document.getElementById('fin-descricao').value;
    const valor = document.getElementById('fin-valor').value;
    const vencimento = document.getElementById('fin-vencimento').value;
    const status = document.getElementById('fin-status').value;

    if (!descricao || !valor || !vencimento) return alert('Preencha os campos obrigatórios!');

    try {
        const res = await fetch(`${API_URL}/financeiro`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ descricao, valor: parseFloat(valor), tipo, data_vencimento: vencimento, status })
        });
        const data = await res.json();
        if (data.success) {
            alert('Lançamento salvo!');
            document.getElementById('modal-financeiro').style.display = 'none';
            document.getElementById('fin-descricao').value = '';
            document.getElementById('fin-valor').value = '';
            document.getElementById('fin-vencimento').value = '';
            document.getElementById('fin-status').value = 'Pendente';
            carregarFinanceiro();
            carregarSaldoDia();
        } else {
            alert(data.message || 'Erro');
        }
    } catch (err) {
        console.error(err);
        alert('Erro ao se comunicar com o servidor');
    }
};

window.carregarFinanceiro = async function () {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/financeiro`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();

        const tbody = document.getElementById('lista-financeiro');
        if (!tbody) return;
        tbody.innerHTML = '';

        let totalReceber = 0;
        let totalPagar = 0;

        if (data.success && data.lancamentos) {
            data.lancamentos.forEach(l => {
                const isRec = l.tipo === 'Receita';
                if (l.status === 'Pendente') {
                    if (isRec) totalReceber += parseFloat(l.valor);
                    else totalPagar += parseFloat(l.valor);
                }

                const dVenc = new Date(l.data_vencimento + 'T12:00:00Z').toLocaleDateString('pt-BR');
                const corStatus = l.status === 'Pago' ? '#28a745' : (l.status === 'Cancelado' ? '#dc3545' : '#ffc107');
                const btnPagar = l.status === 'Pendente' ? `<button onclick="marcarPagoFinanceiro(${l.id})" style="background:#28a745; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:12px; cursor:pointer; margin-right:4px;">✔️ Baixa</button>` : '';
                const btnCancelar = l.status !== 'Cancelado' ? `<button onclick="cancelarFinanceiro(${l.id})" style="background:#dc3545; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:12px; cursor:pointer;">❌</button>` : '';

                tbody.innerHTML += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px;">${dVenc}</td>
                        <td>${l.descricao}</td>
                        <td>${l.conta_origem || '-'}</td>
                        <td style="color:${isRec ? '#28a745' : '#dc3545'}; font-weight:bold;">${l.tipo}</td>
                        <td style="font-weight:bold;">R$ ${parseFloat(l.valor).toFixed(2)}</td>
                        <td><span style="background:${corStatus}; color:${l.status === 'Pendente' ? '#000' : '#fff'}; padding:3px 8px; border-radius:12px; font-size:12px;">${l.status}</span></td>
                        <td>${btnPagar} ${btnCancelar}</td>
                    </tr>
                `;
            });

            document.getElementById('fin-total-receber').textContent = `R$ ${totalReceber.toFixed(2)}`;
            document.getElementById('fin-total-pagar').textContent = `R$ ${totalPagar.toFixed(2)}`;
        }
    } catch (err) {
        console.error(err);
    }
};

window.marcarPagoFinanceiro = async function (id) {
    if (!confirm('Dar baixa/quitar este lançamento?')) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/financeiro/${id}/pagar`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) {
            carregarFinanceiro();
            carregarSaldoDia();
        } else alert(data.message);
    } catch (err) { console.error(err); }
};

window.cancelarFinanceiro = async function (id) {
    if (!confirm('Cancelar este lançamento? Ele ficará marcado como Cancelado/Excluído.')) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/financeiro/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) {
            carregarFinanceiro();
            carregarSaldoDia();
        } else alert(data.message);
    } catch (err) { console.error(err); }
};
window.registrarDespesa = async function () {
    const token = localStorage.getItem('token');
    if (!token) return;

    const descricao = document.getElementById('desp-descricao').value;
    const valor = document.getElementById('desp-valor').value;
    const vencimento = document.getElementById('desp-vencimento').value;
    const status = document.getElementById('desp-status').value;

    if (!descricao || !valor || !vencimento) {
        alert('Por favor, preencha a descrição, valor e data de vencimento.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/financeiro/despesa`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                descricao,
                valor: parseFloat(valor),
                data_vencimento: vencimento,
                status
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('Despesa registrada com sucesso!');
            // Limpa form
            document.getElementById('desp-descricao').value = '';
            document.getElementById('desp-valor').value = '';
            document.getElementById('desp-vencimento').value = '';
            document.getElementById('desp-status').value = 'Pendente';

            // Recarrega dashboard metrics
            await carregarSaldoDia();
            await carregarCompromissosHoje();
        } else {
            alert(data.message || 'Erro ao registrar despesa');
        }
    } catch (err) {
        console.error('Erro ao registrar despesa:', err);
        alert('Erro de conexão com o servidor');
    }
};

window.pagarDespesa = async function (id) {
    if (!confirm('Confirmar o pagamento desta despesa? O valor será deduzido do Saldo Líquido de hoje.')) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/financeiro/despesa/${id}/pagar`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            alert('Despesa paga com sucesso!');
            await carregarSaldoDia();
            await carregarCompromissosHoje();
        } else {
            alert(data.message || 'Erro ao pagar despesa');
        }
    } catch (err) {
        console.error('Erro ao pagar despesa:', err);
        alert('Erro ao processar pagamento');
    }
};

// ============ FORNECEDORES & PEDIDOS DE COMPRA ============ //

window.carregarFornecedores = async function () {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/fornecedores`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (!data.success) return;

        const tbody = document.getElementById('corpo-tabela-fornecedores');
        const selectPedForn = document.getElementById('ped-fornecedor-id');

        if (tbody) tbody.innerHTML = '';
        if (selectPedForn) selectPedForn.innerHTML = '<option value="">-- Selecione o Fornecedor --</option>';

        data.fornecedores.forEach(f => {
            // Tabela
            if (tbody) {
                tbody.innerHTML += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px;">${f.id}</td>
                        <td>${f.razao_social}</td>
                        <td>${f.cnpj}</td>
                        <td>${f.contato || '-'}</td>
                        <td>${f.telefone || '-'}</td>
                        <td>
                            <button onclick="abrirEdicaoFornecedor(${f.id}, '${f.razao_social}', '${f.cnpj}', '${f.contato || ''}', '${f.telefone || ''}')" 
                                style="background:#ffc107; color:black; border:none; padding:5px; border-radius:4px;">✏️ Editar</button>
                        </td>
                    </tr>`;
            }

            // Select Form
            if (selectPedForn) {
                selectPedForn.innerHTML += `<option value="${f.id}">${f.razao_social} (${f.cnpj})</option>`;
            }
        });
    } catch (err) {
        console.error('Erro ao carregar fornecedores:', err);
    }
};

window.salvarFornecedor = async function () {
    const token = localStorage.getItem('token');
    if (!token) return alert('Sessão expirada.');

    const razao = document.getElementById('forn-razao').value;
    const cnpj = document.getElementById('forn-cnpj').value;
    const contato = document.getElementById('forn-contato').value;
    const telefone = document.getElementById('forn-telefone').value;

    if (!razao || !cnpj) return alert('A Razão Social e CNPJ são obrigatórios.');

    try {
        const response = await fetch(`${API_URL}/fornecedores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ razao_social: razao, cnpj, contato, telefone })
        });

        const data = await response.json();
        if (data.success) {
            alert('Fornecedor Cadastrado!');
            document.getElementById('forn-razao').value = '';
            document.getElementById('forn-cnpj').value = '';
            document.getElementById('forn-contato').value = '';
            document.getElementById('forn-telefone').value = '';
            await carregarFornecedores();
        } else {
            alert(data.message || 'Erro ao guardar fornecedor');
        }
    } catch (err) {
        console.error(err);
        alert('Erro de rede');
    }
};

window.abrirEdicaoFornecedor = function (id, razao, cnpj, contato, telefone) {
    document.getElementById('edit-forn-id').value = id;
    document.getElementById('edit-forn-razao').value = razao;
    document.getElementById('edit-forn-cnpj').value = cnpj;
    document.getElementById('edit-forn-contato').value = contato;
    document.getElementById('edit-forn-telefone').value = telefone;
    document.getElementById('modal-edicao-fornecedor').style.display = 'block';
};

window.confirmarEdicaoFornecedor = async function () {
    const token = localStorage.getItem('token');

    const id = document.getElementById('edit-forn-id').value;
    const razao = document.getElementById('edit-forn-razao').value;
    const cnpj = document.getElementById('edit-forn-cnpj').value;
    const contato = document.getElementById('edit-forn-contato').value;
    const telefone = document.getElementById('edit-forn-telefone').value;

    try {
        const response = await fetch(`${API_URL}/fornecedores/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ razao_social: razao, cnpj, contato, telefone })
        });

        const data = await response.json();
        if (data.success) {
            alert('Fornecedor Atualizado!');
            document.getElementById('modal-edicao-fornecedor').style.display = 'none';
            await carregarFornecedores();
        } else {
            alert(data.message || 'Erro ao atualizar');
        }
    } catch (err) {
        console.error(err);
        alert('Erro de rede');
    }
};

window.registrarPedidoCompra = async function () {
    const token = localStorage.getItem('token');

    const fornecedor_id = document.getElementById('ped-fornecedor-id').value;
    const produto_id = document.getElementById('ped-produto-id').value; // Usando o select da aba de vendas/produtos
    const quantidade = document.getElementById('ped-quantidade').value;
    const custo = document.getElementById('ped-custo').value;

    if (!fornecedor_id || !produto_id || !quantidade || !custo) {
        return alert('Por favor, preencha todos os campos para registar a entrada de stock.');
    }

    if (!confirm('Dar entrada nesta mercadoria? O estoque será somado instantaneamente.')) return;

    try {
        const response = await fetch(`${API_URL}/fornecedores/pedido`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                fornecedor_id: fornecedor_id,
                produto_id: produto_id,
                quantidade: parseInt(quantidade),
                preco_custo: parseFloat(custo)
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('Sucesso! Mercadoria registrada e Estoque Atualizado. 📦✅');
            document.getElementById('ped-quantidade').value = '';
            document.getElementById('ped-custo').value = '';

            // Sync overall system
            await Promise.all([
                carregarProdutos(),
                carregarEstoqueMinimo(),
                carregarSaldoDia() // If the optional Despesa generation was hit
            ]);
        } else {
            alert(data.message || 'Erro ao registrar pedido');
        }
    } catch (err) {
        console.error(err);
        alert('Falha na comunicação com o servidor.');
    }
};