const API_URL = '/api';

// Variáveis de estado globais
window.filtroDataInicio = null;
window.filtroDataFim = null;
window.carrinho = [];
window.usuarioLogado = null;

// ============ AUTENTICAÇÃO ============
window.fazerLogin = async function() {
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
        
        // Carrega dados do dashboard
        await carregarDashboard();
        
        alert(`Bem-vindo, ${data.usuario.nome}!`);
    } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao conectar com o servidor');
    }
};

window.fazerLogout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.usuarioLogado = null;
    document.getElementById('login-area').style.display = 'block';
    document.getElementById('dashboard-area').style.display = 'none';
    document.getElementById('email').value = '';
    document.getElementById('senha').value = '';
};

// ============ CLIENTES ============
window.cadastrarCliente = async function() {
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
window.cadastrarProduto = async function() {
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
window.aplicarFiltros = async function() {
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

window.limparFiltros = async function() {
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
    const vendas = data.vendas || data || [];

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
                <td style="text-align: center;">
                    <button onclick="reimprimirVenda(${v.id})" style="background:#17a2b8; color:white; border:none; padding:5px; border-radius:4px;">📄 PDF</button>
                </td>
            </tr>`;
    });
}

// ============ DASHBOARD ============
window.carregarDashboard = async function() {
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
            carregarEstoqueMinimo()
        ]);
    } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
    }
};

// Carrega produtos para a tabela e selects
window.carregarProdutos = async function() {
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
                    <td>
                        <button onclick="abrirEdicao(${p.id}, '${p.nome}', ${p.preco_venda}, ${p.preco_custo}, ${p.estoque_minimo})" 
                            style="background:#ffc107; color:black; border:none; padding:5px; border-radius:4px; margin-right:5px;">✏️ Editar</button>
                        <button onclick="deletarProduto(${p.id})" 
                            style="background:#dc3545; color:white; border:none; padding:5px; border-radius:4px;">🗑️ Deletar</button>
                    </td>
                </tr>`;
        });
        
        // Preenche select de produtos
        const selectProdutos = document.getElementById('select-produtos');
        selectProdutos.innerHTML = '<option value="">-- Selecione um produto --</option>';
        
        produtos.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = `${p.nome} - R$ ${parseFloat(p.preco_venda).toFixed(2)}`;
            selectProdutos.appendChild(option);
        });
        
    } catch (err) {
        console.error('Erro ao carregar produtos:', err);
    }
};

// Carrega clientes para a venda
window.carregarClientes = async function() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/clientes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        const clientes = Array.isArray(data) ? data : (data.clientes || []);
        
        const selectClientes = document.getElementById('select-clientes');
        selectClientes.innerHTML = '<option value="">-- Selecione um cliente --</option>';
        
        clientes.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.nome;
            selectClientes.appendChild(option);
        });
        
    } catch (err) {
        console.error('Erro ao carregar clientes:', err);
    }
};

// Carrega lucro mensal
window.carregarLucroMensal = async function() {
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
window.carregarVendasHoje = async function() {
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

// Carrega faturamento mensal
window.carregarFaturamentoMensal = async function() {
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
window.carregarEstoqueMinimo = async function() {
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

// Abre modal de edição
window.abrirEdicao = function(id, nome, venda, custo, minimo) {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-nome').value = nome;
    document.getElementById('edit-nome-titulo').textContent = nome;
    document.getElementById('edit-venda').value = venda;
    document.getElementById('edit-custo').value = custo;
    document.getElementById('edit-minimo').value = minimo;
    document.getElementById('modal-edicao').style.display = 'block';
};

// Salva edição do produto
window.salvarEdicao = async function() {
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
        console.error('Erro:', err);
        alert('Erro ao salvar alterações');
    }
};

// Deleta produto
window.deletarProduto = async function(id) {
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

// Adiciona item ao carrinho
window.adicionarAoCarrinho = async function() {
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
window.atualizarCarrinho = function() {
    const lista = document.getElementById('carrinho-lista');
    const btnFinalizar = document.getElementById('btn-finalizar');
    
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
        btnFinalizar.style.display = 'block';
    } else {
        btnFinalizar.style.display = 'none';
    }
};

// Remove item do carrinho
window.removerDoCarrinho = function(index) {
    window.carrinho.splice(index, 1);
    atualizarCarrinho();
};

// Finaliza venda
window.finalizarVenda = async function() {
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

// Exportar para Excel
window.exportarExcel = function() {
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