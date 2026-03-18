// ==========================================
// ESTADO E VARIÁVEIS GLOBAIS
// ==========================================
let empresas = [];
let editandoId = null;
let currentViewMode = localStorage.getItem('nexus_view_mode') || 'table';

// ==========================================
// SELETORES DE ELEMENTOS
// ==========================================
const sidebar = document.querySelector(".sidebar");
const sidebarBtn = document.querySelector(".sidebarBtn");
const modal = document.getElementById("formModal");
const form = document.getElementById("empresaForm");
const tabelaBody = document.getElementById("tabelaEmpresas");
const tableContainer = document.getElementById("tableContainer");
const gridEmpresas = document.getElementById("gridEmpresas");
const emptyState = document.getElementById("emptyState");
const toastContainer = document.getElementById("toastContainer");
const topbarPins = document.getElementById("topbarPins");

const mainColumn = document.getElementById("mainColumn");
const iframeColumn = document.getElementById("iframeColumn");
const mapColumn = document.getElementById("mapColumn");

const sistemaIframe = document.getElementById("sistemaIframe");
const iframeTitle = document.getElementById("iframeTitle");
const iframeIcon = document.getElementById("iframeIcon");
const iframeFallbackIcon = document.getElementById("iframeFallbackIcon");
const openExternalBtn = document.getElementById("openExternalBtn");
const dashboardTitle = document.getElementById("dashboardTitle");
const iframeAlert = document.getElementById("iframeAlert");

const subMenuEmpresas = document.getElementById("subMenuEmpresas");
const arrowEmpresas = document.getElementById("arrowEmpresas");
const linkPainel = document.getElementById("linkPainel");
const btnToggleView = document.getElementById("btnToggleView");

// ==========================================
// INICIALIZAÇÃO E EVENTOS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('nexus_auth') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    const userEmail = localStorage.getItem('nexus_user');
    if (userEmail) {
        const username = userEmail.split('@')[0];
        document.querySelector('.admin_name').innerText = username.charAt(0).toUpperCase() + username.slice(1);
    }

    sidebarBtn.onclick = function () {
        sidebar.classList.toggle("active");
    }

    if (btnToggleView) {
        atualizarIconeToggle();
        btnToggleView.addEventListener('click', () => {
            currentViewMode = currentViewMode === 'table' ? 'grid' : 'table';
            localStorage.setItem('nexus_view_mode', currentViewMode);
            atualizarIconeToggle();
            renderizarViews();
            mostrarToast(currentViewMode === 'table' ? "Visão em Lista ativada." : "Visão em Grid ativada.", "info");
        });
    }

    const siteUrlField = document.getElementById('siteUrl');
    if (siteUrlField) {
        siteUrlField.addEventListener('blur', applyMagicAutoFill);
    }

    carregarDados();

    if (form) form.addEventListener('submit', salvarEmpresa);

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', filtrarEmpresas);
});

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        const s = document.getElementById('searchInput');
        if (s) {
            s.focus();
            s.select();
        }
    }
    if (e.shiftKey && e.code === 'KeyN') {
        if (!modal.classList.contains('active')) {
            e.preventDefault();
            abrirModal();
        }
    }
});

function atualizarIconeToggle() {
    if (currentViewMode === 'grid') {
        btnToggleView.className = "bx bx-list-ul view-toggle-btn";
        btnToggleView.title = "Ver como Lista";
    } else {
        btnToggleView.className = "bx bx-grid-alt view-toggle-btn";
        btnToggleView.title = "Ver como Grid";
    }
}

function applyMagicAutoFill(e) {
    let url = e.target.value.trim();
    if (!url) return;

    try {
        let domainStr = url.startsWith('http') ? url : 'https://' + url;
        let domainHostname = new URL(domainStr).hostname.replace('www.', '');
        if (!domainHostname) return;

        let principalWord = domainHostname.split('.')[0];
        let nomeCapitalized = principalWord.charAt(0).toUpperCase() + principalWord.slice(1);

        let nomeField = document.getElementById('nomeEmpresa');
        if (!nomeField.value) nomeField.value = nomeCapitalized;

        let tipoField = document.getElementById('tipoItem');
        if (!tipoField.value) {
            if (url.includes('docs.google') || url.includes('excel')) {
                tipoField.value = 'planilha';
            } else if (url.includes('.gov.br')) {
                tipoField.value = 'sistema';
            } else {
                tipoField.value = 'sistema';
            }
        }
    } catch (err) {
    }
}

function getClearbitLogoUrl(url, nome) {
    let domain = "";
    if (url && url !== "-") {
        try {
            let domainStr = url.startsWith('http') ? url : 'https://' + url;
            domain = new URL(domainStr).hostname.replace('www.', '');
        } catch (e) { }
    }

    if (!domain && nome) {
        domain = nome.toLowerCase().trim().replace(/\s+/g, '') + '.com.br';
    }

    if (domain) {
        return 'https://logo.clearbit.com/' + domain + '?size=128';
    }

    return getUiAvatarUrl(nome);
}

function getGoogleFaviconUrl(url, nome) {
    let domain = "";
    if (url && url !== "-") {
        try {
            let domainStr = url.startsWith('http') ? url : 'https://' + url;
            domain = new URL(domainStr).hostname;
        } catch (e) { }
    }
    if (domain) {
        return 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=128';
    }
    return getUiAvatarUrl(nome);
}

function getUiAvatarUrl(nome) {
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(nome || 'A') + '&background=random&color=fff';
}

window.handleImageError = function (img, fallbackUrl, avatarUrl) {
    if (img.src === avatarUrl) return;

    img.onerror = null;

    img.src = fallbackUrl;

    setTimeout(() => {
        if (img.naturalWidth <= 16 && img.src.includes('google')) {
            img.src = avatarUrl;
        }
    }, 1000);
};

// ==========================================
// NAVEGAÇÃO / VIEWS (PAINEL vs IFRAME)
// ==========================================
function mostrarPainel() {
    mainColumn.style.display = 'block';
    iframeColumn.style.display = 'none';
    if (mapColumn) mapColumn.style.display = 'none';

    dashboardTitle.innerText = "Painel de Controle";

    setTimeout(() => {
        if (sistemaIframe) sistemaIframe.src = '';
    }, 300);

    document.querySelectorAll(".nav-links a").forEach(l => l.classList.remove("active"));
    linkPainel.classList.add("active");
}

function abrirIframeFullScreen(url, nomeEmpresa, empresaId) {
    if (!url || url === 'undefined') {
        mostrarToast("Este item não possui um link cadastrado.", "error");
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    mainColumn.style.display = 'none';
    if (mapColumn) mapColumn.style.display = 'none';
    iframeColumn.style.display = 'flex';

    if (url.includes("docs.google.com/spreadsheets") || url.includes("excel")) {
        iframeAlert.style.display = 'block';
    } else {
        iframeAlert.style.display = 'none';
    }

    dashboardTitle.innerText = "Visualização: " + nomeEmpresa;

    iframeTitle.innerText = nomeEmpresa;
    iframeIcon.src = getClearbitLogoUrl(url, nomeEmpresa);
    iframeIcon.onerror = function () {
        window.handleImageError(this, getGoogleFaviconUrl(url, nomeEmpresa), getUiAvatarUrl(nomeEmpresa));
    };
    iframeIcon.style.display = 'inline-block';
    iframeFallbackIcon.style.display = 'none';

    // NOTAS DO IFRAME
    if (empresaId) {
        let emp = empresas.find(e => e.id === empresaId);
        const iframeNotes = document.getElementById("iframeNotes");
        if (iframeNotes) {
            iframeNotes.value = emp ? (emp.notas || "") : "";
            iframeNotes.oninput = (e) => {
                if (emp) {
                    emp.notas = e.target.value;
                    salvarDados();
                }
            };
        }
    }

    openExternalBtn.href = url;

    mostrarToast("Abrindo... Dica: Se ficar branco, use o botão de 'Abrir em nova aba'", "success");
    sistemaIframe.src = url;

    document.querySelectorAll(".nav-links a").forEach(l => l.classList.remove("active"));
}

function toggleSubMenuEmpresas() {
    if (subMenuEmpresas.style.display === "none" || subMenuEmpresas.style.display === "") {
        subMenuEmpresas.style.display = "block";
        arrowEmpresas.className = "bx bx-chevron-up";
    } else {
        subMenuEmpresas.style.display = "none";
        arrowEmpresas.className = "bx bx-chevron-down";
    }
}

function renderizarSidebarLogos() {
    subMenuEmpresas.innerHTML = "";
    if (empresas.length === 0) {
        subMenuEmpresas.innerHTML = "<li style='padding-left:15px; font-size:12px; color:var(--text-secondary);'>Nenhum item cadastrado</li>";
        return;
    }

    empresas.forEach(emp => {
        const urlToUse = emp.siteUrl || '';

        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#";

        if (urlToUse) {
            a.onclick = (e) => {
                e.preventDefault();
                document.querySelectorAll(".nav-links a").forEach(l => l.classList.remove("active"));
                a.classList.add("active");
                abrirIframeFullScreen(urlToUse, emp.nome, emp.id);
            };
        } else {
            a.onclick = (e) => {
                e.preventDefault();
                mostrarToast("Sem link de acesso!", "error");
            }
            a.style.opacity = '0.5';
        }

        const img = document.createElement("img");
        img.src = getClearbitLogoUrl(urlToUse, emp.nome);
        img.onerror = function () {
            window.handleImageError(this, getGoogleFaviconUrl(urlToUse, emp.nome), getUiAvatarUrl(emp.nome));
        };
        img.alt = emp.nome;

        const span = document.createElement("span");
        span.className = "company-name";
        span.innerText = emp.nome.length > 20 ? emp.nome.substring(0, 17) + "..." : emp.nome;

        a.appendChild(img);
        a.appendChild(span);
        li.appendChild(a);

        subMenuEmpresas.appendChild(li);
    });
}

function renderizarPinosTopbar() {
    if (!topbarPins) return;
    topbarPins.innerHTML = "";

    const pinados = empresas.filter(emp => emp.isPinned === true);

    pinados.forEach(emp => {
        const urlToUse = emp.siteUrl || '';
        const img = document.createElement("img");
        img.src = getClearbitLogoUrl(urlToUse, emp.nome);
        img.onerror = function () {
            window.handleImageError(this, getGoogleFaviconUrl(urlToUse, emp.nome), getUiAvatarUrl(emp.nome));
        };
        img.alt = emp.nome;
        img.title = "Abrir " + emp.nome;

        img.onclick = () => {
            if (urlToUse) {
                abrirIframeFullScreen(urlToUse, emp.nome, emp.id);
            } else {
                mostrarToast("Este atalho não possui URL cadastrada.", "error");
            }
        };

        topbarPins.appendChild(img);
    });
}

// ==========================================
// FUNÇÕES DE CRUD E LOCAL STORAGE
// ==========================================
function getUserPrefix() {
    return localStorage.getItem('nexus_user') || 'default';
}

async function carregarDados() {
    const prefix = getUserPrefix();
    const { data, error } = await supabaseClient.from('empresas').select('*').eq('user_email', prefix);
    
    if (error) { console.error("Erro ao carregar:", error); return; }
    if (data) empresas = data;

    renderizarViews();
    atualizarDashboard();
    renderizarSidebarLogos();
    renderizarPinosTopbar();
}

function salvarDados() {
    // Agora o salvamento Ã© feito diretamente no Supabase pelas funÃ§Ãµes de CRUD.
    atualizarDashboard();
    renderizarSidebarLogos();
    renderizarPinosTopbar();
}

function togglePin(id) {
    const empresa = empresas.find(emp => emp.id === id);
    if (empresa) {
        empresa.isPinned = !empresa.isPinned;
        salvarDados();
        renderizarViews();
    }
}

window.togglePin = togglePin;
window.abrirIframeFullScreen = abrirIframeFullScreen;
window.prepararEdicao = prepararEdicao;
window.deletarEmpresa = deletarEmpresa;

async function salvarEmpresa(e) {
    e.preventDefault();

    const nomeEmpresa = document.getElementById('nomeEmpresa').value.trim();
    const cnpjEmpresa = document.getElementById('cnpjEmpresa') ? document.getElementById('cnpjEmpresa').value.trim() : """";
    const nomeContato = document.getElementById('nomeContato').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const tipoItem = document.getElementById('tipoItem').value;
    const status = document.getElementById('status').value;
    const siteUrl = document.getElementById('siteUrl').value.trim();

    const loginCofre = document.getElementById('loginCofre') ? document.getElementById('loginCofre').value.trim() : """";
    const senhaCofre = document.getElementById('senhaCofre') ? document.getElementById('senhaCofre').value.trim() : """";

    if (!nomeEmpresa || !tipoItem) { mostrarToast(""Preencha o Nome e o Tipo!"", ""error""); return; }

    const editandoTarget = empresas.find(emp => emp.id === editandoId);

    const novaEmpresa = {
        nome: nomeEmpresa,
        cnpj: cnpjEmpresa || ""-"",
        contato: nomeContato || ""-"",
        telefone: telefone || ""-"",
        tipo: tipoItem,
        origem: tipoItem,
        status: status,
        siteUrl: siteUrl,
        loginCofre: loginCofre,
        senhaCofre: senhaCofre,
        notas: editandoTarget ? editandoTarget.notas : """",
        isPinned: editandoTarget ? editandoTarget.isPinned : false
    };

    if (editandoId) {
        const { error } = await supabaseClient.from('empresas').update(novaEmpresa).eq('id', editandoId);
        if (error) { mostrarToast(""Erro ao atualizar"", ""error""); return; }
        mostrarToast(""Atualizado com sucesso!"");
    } else {
        const { error } = await supabaseClient.from('empresas').insert([{ ...novaEmpresa, user_email: getUserPrefix() }]);
        if (error) { mostrarToast(""Erro ao cadastrar"", ""error""); return; }
        mostrarToast(""Cadastrado com sucesso!"");
    }

    carregarDados();
    fecharModal();
}

function deletarEmpresa(id) {
    if (confirm("Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.")) {
        empresas = empresas.filter(emp => emp.id !== id);
        salvarDados();
        renderizarViews();
        mostrarPainel();
        mostrarToast("Registro excluído com sucesso!", "success");
    }
}

function prepararEdicao(id) {
    const empresa = empresas.find(emp => emp.id === id);
    if (empresa) {
        editandoId = id;

        document.getElementById('modalTitle').innerText = "Editar Cadastro / Integração";
        document.getElementById('empresaId').value = empresa.id;
        document.getElementById('nomeEmpresa').value = empresa.nome;
        if (document.getElementById('cnpjEmpresa')) document.getElementById('cnpjEmpresa').value = (empresa.cnpj && empresa.cnpj !== "-") ? empresa.cnpj : "";
        document.getElementById('nomeContato').value = empresa.contato !== "-" ? empresa.contato : "";
        document.getElementById('telefone').value = empresa.telefone !== "-" ? empresa.telefone : "";

        const dropDownTipo = (empresa.tipo || empresa.origem) === 'site' ? 'sistema' : (empresa.tipo || empresa.origem);

        document.getElementById('tipoItem').value = dropDownTipo;
        document.getElementById('status').value = empresa.status;
        document.getElementById('siteUrl').value = empresa.siteUrl || '';
        if (document.getElementById('loginCofre')) document.getElementById('loginCofre').value = empresa.loginCofre || '';
        if (document.getElementById('senhaCofre')) document.getElementById('senhaCofre').value = empresa.senhaCofre || '';

        document.getElementById('btnSalvar').innerText = "Atualizar Cadastro";

        modal.classList.add('active');
    }
}

// ==========================================
// FUNÇÕES DE UI E RENDERIZAÇÃO
// ==========================================
function abrirModal() {
    editandoId = null;
    form.reset();
    document.getElementById('modalTitle').innerText = "Novo Cadastro / Integração";
    document.getElementById('btnSalvar').innerText = "Concluir Cadastro";
    document.getElementById('empresaId').value = '';
    modal.classList.add('active');
}

function fecharModal() {
    modal.classList.remove('active');
    setTimeout(() => {
        form.reset();
        editandoId = null;
    }, 300);
}

function formatarTipo(tipo) {
    const mapa = {
        'sistema': 'Sistema / Site',
        'site': 'Sistema / Site',
        'app': 'Aplicativo Mobile',
        'planilha': 'Planilha',
        'empresa': 'Empresa Cliente',
        'outro': 'Outro / Dashboard',
    };
    return mapa[tipo] || tipo;
}

function formatarStatus(status) {
    const mapa = {
        'novo': 'NOVO',
        'ativo': 'ATIVO',
        'manutencao': 'MANUTENÇÃO',
        'arquivado': 'INATIVO',
        'em_contato': 'CONTATO',
        'ganho': 'ATIVO',
        'proposta': 'ALERTA',
        'perdido': 'INATIVO'
    };
    return mapa[status] || status.toUpperCase();
}

function getStatusClass(status) {
    const mapa = {
        'novo': 'novo',
        'ativo': 'ganho',
        'manutencao': 'em_contato',
        'arquivado': 'perdido',
        'ganho': 'ganho',
        'perdido': 'perdido',
        'em_contato': 'em_contato',
        'proposta': 'proposta'
    };
    return mapa[status] || 'novo';
}

function renderizarViews(dados = null) {
    const lista = dados || empresas;

    if (lista.length === 0) {
        emptyState.classList.add('show');
        if (tableContainer) tableContainer.style.display = 'none';
        if (gridEmpresas) gridEmpresas.style.display = 'none';
        return;
    }

    emptyState.classList.remove('show');

    if (currentViewMode === 'table') {
        if (gridEmpresas) gridEmpresas.style.display = 'none';
        if (tableContainer) {
            tableContainer.style.display = 'block';
            tabelaBody.innerHTML = '';
            lista.forEach(emp => {
                const urlValue = emp.siteUrl || '';
                const cssStatusReal = getStatusClass(emp.status);
                const tipoView = emp.tipo || emp.origem;
                const disableLinkClass = !urlValue ? 'opacity: 0.3; cursor: not-allowed;' : '';

                const tr = document.createElement('tr');

                const tdNome = document.createElement('td');
                const divContainer = document.createElement('div');
                divContainer.style.display = 'flex';
                divContainer.style.alignItems = 'center';
                divContainer.style.gap = '10px';

                const imgLogo = document.createElement('img');
                imgLogo.src = getClearbitLogoUrl(urlValue, emp.nome);
                imgLogo.style.width = '20px';
                imgLogo.style.height = '20px';
                imgLogo.style.objectFit = 'contain';
                imgLogo.style.borderRadius = '4px';
                imgLogo.onerror = function () {
                    window.handleImageError(this, getGoogleFaviconUrl(urlValue, emp.nome), getUiAvatarUrl(emp.nome));
                };

                const bNome = document.createElement('strong');
                bNome.innerText = emp.nome;

                divContainer.appendChild(imgLogo);
                divContainer.appendChild(bNome);
                tdNome.appendChild(divContainer);

                const tdPin = document.createElement('td');
                const btnPin = document.createElement('button');
                btnPin.className = "star-btn " + (emp.isPinned ? "pinned" : "");
                btnPin.title = "Fixar na Topbar";
                btnPin.onclick = () => window.togglePin(emp.id);
                const iPin = document.createElement('i');
                iPin.className = "bx " + (emp.isPinned ? "bxs-star" : "bx-star");
                btnPin.appendChild(iPin);
                tdPin.appendChild(btnPin);

                const tdTipo = document.createElement('td');
                tdTipo.innerText = formatarTipo(tipoView);

                const tdStatus = document.createElement('td');
                const spanStatus = document.createElement('span');
                spanStatus.className = "status-badge status-" + cssStatusReal;
                spanStatus.innerText = formatarStatus(emp.status);
                tdStatus.appendChild(spanStatus);

                const tdActionOpen = document.createElement('td');
                const btnAbrir = document.createElement('button');
                btnAbrir.className = "action-btn";
                btnAbrir.title = "Acessar";
                btnAbrir.style.cssText = "color: var(--primary-color); font-size: 14px; background: var(--primary-light); padding: 5px 10px; border-radius: 6px; " + disableLinkClass;
                btnAbrir.innerHTML = "<i class='bx bx-window-alt' style='vertical-align: middle;'></i> Abrir";
                btnAbrir.onclick = () => window.abrirIframeFullScreen(urlValue, emp.nome, emp.id);

                const btnCofre = document.createElement('button');
                btnCofre.className = "action-btn cofre-btn";
                btnCofre.title = "Ver Credenciais de Acesso";
                btnCofre.style.cssText = "color: #333; font-size: 14px; background: #e2e8f0; padding: 5px 10px; border-radius: 6px; margin-left:5px;";
                btnCofre.innerHTML = "<i class='bx bx-lock-alt' style='vertical-align: middle;'></i>";
                btnCofre.onclick = () => {
                    const l = emp.loginCofre || "Não cadastrado";
                    const s = emp.senhaCofre || "Não cadastrada";
                    alert(`🔐 CRENDENCIAIS DO COFRE\n\nLogin: ${l}\nSenha: ${s}`);
                };

                tdActionOpen.appendChild(btnAbrir);
                tdActionOpen.appendChild(btnCofre);

                const tdActionEdit = document.createElement('td');

                const btnDocs = document.createElement('button');
                btnDocs.className = "action-btn";
                btnDocs.title = "Documentos e Arquivos";
                btnDocs.innerHTML = "<i class='bx bx-folder'></i>";
                btnDocs.onclick = () => window.abrirPerfilCliente(emp.id);
                btnDocs.style.color = "var(--primary-color)";

                const btnEdit = document.createElement('button');
                btnEdit.className = "action-btn edit";
                btnEdit.title = "Editar";
                btnEdit.innerHTML = "<i class='bx bx-edit'></i>";
                btnEdit.onclick = () => window.prepararEdicao(emp.id);

                const btnDelete = document.createElement('button');
                btnDelete.className = "action-btn delete";
                btnDelete.title = "Excluir";
                btnDelete.innerHTML = "<i class='bx bx-trash'></i>";
                btnDelete.onclick = () => window.deletarEmpresa(emp.id);

                tdActionEdit.appendChild(btnDocs);
                tdActionEdit.appendChild(btnEdit);
                tdActionEdit.appendChild(btnDelete);

                tr.appendChild(tdNome);
                tr.appendChild(tdPin);
                tr.appendChild(tdTipo);
                tr.appendChild(tdStatus);
                tr.appendChild(tdActionOpen);
                tr.appendChild(tdActionEdit);

                tabelaBody.appendChild(tr);
            });
        }
    } else {
        if (tableContainer) tableContainer.style.display = 'none';
        if (gridEmpresas) {
            gridEmpresas.style.display = 'grid';
            gridEmpresas.innerHTML = '';
            lista.forEach(emp => {
                const card = document.createElement('div');
                card.className = "grid-card";
                const urlValue = emp.siteUrl || '';
                const cssStatusReal = getStatusClass(emp.status);
                const tipoView = formatarTipo(emp.tipo || emp.origem);

                card.ondblclick = () => {
                    if (urlValue) window.abrirIframeFullScreen(urlValue, emp.nome, emp.id);
                };

                const imgLogo = document.createElement('img');
                imgLogo.src = getClearbitLogoUrl(urlValue, emp.nome);
                imgLogo.className = 'grid-card-icon';
                imgLogo.onerror = function () {
                    window.handleImageError(this, getGoogleFaviconUrl(urlValue, emp.nome), getUiAvatarUrl(emp.nome));
                };

                const titleDiv = document.createElement('div');
                titleDiv.className = 'grid-card-title';
                titleDiv.innerText = emp.nome;

                const subtitleDiv = document.createElement('div');
                subtitleDiv.className = 'grid-card-subtitle';
                subtitleDiv.innerText = tipoView;

                const badgeDiv = document.createElement('div');
                badgeDiv.className = "grid-card-badge status-" + cssStatusReal + " status-badge";
                badgeDiv.innerText = formatarStatus(emp.status);

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'grid-card-actions';

                const btnPin = document.createElement('button');
                btnPin.className = "star-btn " + (emp.isPinned ? "pinned" : "");
                btnPin.title = "Fixar na Topbar";
                btnPin.onclick = (e) => { e.stopPropagation(); window.togglePin(emp.id); };
                btnPin.innerHTML = "<i class='bx " + (emp.isPinned ? "bxs-star" : "bx-star") + "'></i>";

                const btnCofre = document.createElement('button');
                btnCofre.className = "action-btn";
                btnCofre.title = "Acessos do Cofre";
                btnCofre.onclick = (e) => {
                    e.stopPropagation();
                    const l = emp.loginCofre || "N/A";
                    const s = emp.senhaCofre || "N/A";
                    alert(`🔐 COFRE\nLogin: ${l}\nSenha: ${s}`);
                };
                btnCofre.innerHTML = "<i class='bx bx-lock-alt' style='color: #888;'></i>";

                const btnDocs = document.createElement('button');
                btnDocs.className = "action-btn";
                btnDocs.title = "Documentos e Arquivos";
                btnDocs.onclick = (e) => { e.stopPropagation(); window.abrirPerfilCliente(emp.id); };
                btnDocs.innerHTML = "<i class='bx bx-folder' style='color: var(--primary-color)'></i>";

                const btnEdit = document.createElement('button');
                btnEdit.className = "action-btn edit";
                btnEdit.title = "Editar";
                btnEdit.onclick = (e) => { e.stopPropagation(); window.prepararEdicao(emp.id); };
                btnEdit.innerHTML = "<i class='bx bx-edit'></i>";

                const btnDelete = document.createElement('button');
                btnDelete.className = "action-btn delete";
                btnDelete.title = "Excluir";
                btnDelete.onclick = (e) => { e.stopPropagation(); window.deletarEmpresa(emp.id); };
                btnDelete.innerHTML = "<i class='bx bx-trash'></i>";

                actionsDiv.appendChild(btnPin);
                actionsDiv.appendChild(btnCofre);
                actionsDiv.appendChild(btnDocs);
                actionsDiv.appendChild(btnEdit);
                actionsDiv.appendChild(btnDelete);

                card.appendChild(imgLogo);
                card.appendChild(titleDiv);
                card.appendChild(subtitleDiv);
                card.appendChild(badgeDiv);
                card.appendChild(actionsDiv);

                gridEmpresas.appendChild(card);
            });
        }
    }
}

function renderizarTabela() {
    renderizarViews();
}

function atualizarDashboard() {
    document.getElementById('totalEmpresas').innerText = empresas.length;

    const viaSistema = empresas.filter(emp => (emp.tipo === 'sistema' || emp.origem === 'sistema' || emp.origem === 'site')).length;
    document.getElementById('totalSistemas').innerText = viaSistema;

    const viaApp = empresas.filter(emp => (emp.tipo === 'app' || emp.origem === 'app')).length;
    document.getElementById('totalApps').innerText = viaApp;

    const viaPlanilhas = empresas.filter(emp => (emp.tipo === 'planilha' || emp.origem === 'planilha')).length;
    document.getElementById('totalPlanilhas').innerText = viaPlanilhas;
}

function filtrarEmpresas(e) {
    const termo = e.target.value.toLowerCase();

    if (!termo) {
        renderizarViews();
        return;
    }

    const filtradas = empresas.filter(emp =>
        emp.nome.toLowerCase().includes(termo) ||
        (emp.contato && emp.contato.toLowerCase().includes(termo)) ||
        (emp.telefone && emp.telefone.includes(termo)) ||
        (emp.cnpj && emp.cnpj.includes(termo))
    );

    renderizarViews(filtradas);
}

// ==========================================
// SISTEMA DE NOTIFICAÇÕES (TOAST)
// ==========================================
function mostrarToast(mensagem, tipo = 'success') {
    const toast = document.createElement('div');
    toast.className = "toast toast-" + tipo;

    const icone = tipo === 'success' ? 'bx-check-circle' : tipo === 'info' ? 'bx-info-circle' : 'bx-error-circle';

    toast.innerHTML = "<i class='bx " + icone + "'></i><div class='toast-content'><p>" + mensagem + "</p></div>";

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function fazerLogout() {
    localStorage.removeItem('nexus_auth');
    localStorage.removeItem('nexus_user');
    window.location.href = 'login.html';
}

// ==========================================
// MÓDULO DE MAPA DO BRASIL (LEAFLET)
// ==========================================
let map;
let pinsLayer;
let locaisLojistas = [];
let editandoPinId = null;

const pinModal = document.getElementById("pinModal");
const pinForm = document.getElementById("pinForm");

document.addEventListener('DOMContentLoaded', () => {
    carregarPinos();
    if (pinForm) {
        pinForm.addEventListener('submit', window.salvarLojistaLocal);
    }
});

function carregarPinos() {
    const prefix = getUserPrefix();
    const dadosMap = localStorage.getItem('nexus_map_pins_' + prefix);
    if (dadosMap) {
        locaisLojistas = JSON.parse(dadosMap);
    } else {
        const oldData = localStorage.getItem('nexus_map_pins');
        if (oldData) {
            locaisLojistas = JSON.parse(oldData);
            localStorage.setItem('nexus_map_pins_' + prefix, oldData);
            localStorage.removeItem('nexus_map_pins');
        }
    }
}

function salvarPinosLocais() {
    const prefix = getUserPrefix();
    localStorage.setItem('nexus_map_pins_' + prefix, JSON.stringify(locaisLojistas));
    if (pinsLayer) {
        renderizarPinosNoMapa();
    }
}

function initMap() {
    if (map) return;

    map = L.map('map', {
        doubleClickZoom: false
    }).setView([-14.235, -51.925], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    pinsLayer = L.layerGroup().addTo(map);

    function onMapClick(e) {
        abrirModalPin(e.latlng.lat, e.latlng.lng);
    }

    map.on('contextmenu', onMapClick);
    map.on('dblclick', onMapClick);

    renderizarPinosNoMapa();
}

function obterIconePin(status) {
    let color = status === 'ativo' ? '#2ecc71' : status === 'prospect' ? '#f39c12' : '#e74c3c';
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style='background-color:${color}; width:20px; height:20px; border-radius:50%; border:3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.5);'></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}

function renderizarPinosNoMapa() {
    if (!pinsLayer) return;
    pinsLayer.clearLayers();
    locaisLojistas.forEach(local => {
        const marker = L.marker([local.lat, local.lng], { icon: obterIconePin(local.status) });
        marker.bindPopup(`
            <div style="min-width: 150px; padding: 5px; font-family: 'Inter', sans-serif;">
                <h4 style="margin:0 0 5px 0; color:#333; font-size:14px;">${local.nome}</h4>
                <p style="margin:0; font-size:12px; color:#666;"><strong>Situação:</strong> ${local.status.toUpperCase()}</p>
                ${local.contato ? `<p style="margin:5px 0 0 0; font-size:12px; font-weight:bold; color:var(--primary-color);"><i class='bx bx-phone'></i> ${local.contato}</p>` : ''}
                ${local.obs ? `<p style="margin:8px 0 0 0; font-size:11px; border-top:1px solid #eee; padding-top:5px; color:#555;">${local.obs}</p>` : ''}
                <div style="margin-top: 10px; text-align: right;">
                    <button class="btn-secondary" style="font-size:11px; padding:3px 8px; border-radius:4px; cursor:pointer;" onclick="prepararEdicaoPin('${local.id}'); return false;">
                        Editar / Excluir
                    </button>
                </div>
            </div>
        `);
        pinsLayer.addLayer(marker);
    });
}

function mostrarMapa() {
    mainColumn.style.display = 'none';
    iframeColumn.style.display = 'none';
    mapColumn.style.display = 'block';

    document.getElementById("dashboardTitle").innerText = "Mapa de Lojistas e Clientes";

    const allLinks = document.querySelectorAll(".nav-links a");
    allLinks.forEach(l => l.classList.remove("active"));
    const linkMapa = document.getElementById("linkMapa");
    if (linkMapa) linkMapa.classList.add("active");

    initMap();
    setTimeout(() => { map.invalidateSize(); }, 300);
}

function abrirModalPin(lat, lng) {
    editandoPinId = null;
    if (pinForm) pinForm.reset();
    document.getElementById("pinLat").value = lat;
    document.getElementById("pinLng").value = lng;
    document.getElementById('pinModalTitle').innerText = "Novo Local: Lojista/Prospect";
    document.getElementById('btnSalvarPin').innerText = "Salvar Localização";
    document.getElementById('btnDeletePinContainer').style.display = 'none';
    pinModal.classList.add("active");
}

function fecharModalPin() {
    pinModal.classList.remove("active");
}

function salvarLojistaLocal(e) {
    e.preventDefault();
    const nome = document.getElementById("pinNome").value.trim();
    if (!nome) return;

    const latStr = document.getElementById("pinLat").value;
    const lngStr = document.getElementById("pinLng").value;

    const novoPin = {
        id: editandoPinId || Date.now().toString(),
        nome: nome,
        contato: document.getElementById("pinContato").value.trim(),
        status: document.getElementById("pinStatus").value,
        obs: document.getElementById("pinObs").value.trim(),
        lat: parseFloat(latStr),
        lng: parseFloat(lngStr),
        data: new Date().toISOString()
    };

    if (editandoPinId) {
        const index = locaisLojistas.findIndex(l => l.id === editandoPinId);
        if (index > -1) {
            locaisLojistas[index] = novoPin;
        }
        mostrarToast("Local atualizado com sucesso!", "success");
    } else {
        locaisLojistas.push(novoPin);
        mostrarToast("Lojista adicionado no mapa!", "success");
    }

    salvarPinosLocais();
    fecharModalPin();
    map.closePopup();
}

function prepararEdicaoPin(id) {
    const local = locaisLojistas.find(l => l.id === id);
    if (!local) return;

    map.closePopup();
    editandoPinId = id;
    document.getElementById("pinLat").value = local.lat;
    document.getElementById("pinLng").value = local.lng;
    document.getElementById("pinNome").value = local.nome;
    document.getElementById("pinContato").value = local.contato || '';
    document.getElementById("pinStatus").value = local.status || 'ativo';
    document.getElementById("pinObs").value = local.obs || '';

    document.getElementById('pinModalTitle').innerText = "Editar Local (Lojista)";
    document.getElementById('btnSalvarPin').innerText = "Atualizar";
    document.getElementById('btnDeletePinContainer').style.display = 'block';

    pinModal.classList.add("active");
}

function deletarPinSelecionado() {
    if (!editandoPinId) return;
    if (confirm("Remover este local do mapa?")) {
        locaisLojistas = locaisLojistas.filter(l => l.id !== editandoPinId);
        salvarPinosLocais();
        fecharModalPin();
        mostrarToast("Local removido!", "info");
    }
}

window.mostrarMapa = mostrarMapa;
window.fecharModalPin = fecharModalPin;
window.prepararEdicaoPin = prepararEdicaoPin;
window.deletarPinSelecionado = deletarPinSelecionado;

// ==========================================
// MÓDULO DE CONFIGURAÇÕES / TEMA
// ==========================================
function abrirConfiguracoes() {
    const docModal = document.getElementById('configModal');
    if(docModal) docModal.classList.add('active');
    const currentTheme = localStorage.getItem('nexus_theme') || 'light';
    const select = document.getElementById('themeSelect');
    if(select) select.value = currentTheme;
}

function fecharConfiguracoes() {
    const docModal = document.getElementById('configModal');
    if(docModal) docModal.classList.remove('active');
}

function aplicarTema(theme) {
    if(theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

function mudarTema() {
    const select = document.getElementById('themeSelect');
    if(select) {
        const theme = select.value;
        localStorage.setItem('nexus_theme', theme);
        aplicarTema(theme);
    }
}

window.abrirConfiguracoes = abrirConfiguracoes;
window.fecharConfiguracoes = fecharConfiguracoes;
window.mudarTema = mudarTema;

const themeOnLoad = localStorage.getItem('nexus_theme') || 'light';
aplicarTema(themeOnLoad);
// ==========================================
// MÓDULO DE PERFIL / ARQUIVOS
// ==========================================
let clientePerfilId = null;
let clientePerfilTipo = 'empresa'; // 'empresa' ou 'lojista'

function obterClienteContexto() {
    if (clientePerfilTipo === 'lojista') {
        return locaisLojistas.find(l => l.id === clientePerfilId);
    }
    return empresas.find(e => e.id === clientePerfilId);
}

function abrirPerfilCliente(id, tipoContexto = 'empresa') {
    clientePerfilId = id;
    clientePerfilTipo = tipoContexto;

    const cliente = obterClienteContexto();
    if (!cliente) return;

    const perfilModal = document.getElementById('perfilModal');
    if (!perfilModal) return;

    document.getElementById('perfilNome').innerText = cliente.nome;
    document.getElementById('perfilCNPJ').innerText = (cliente.cnpj && cliente.cnpj !== '-') ? 'CNPJ: ' + cliente.cnpj : 'Arquivos do Lojista / Cliente';

    if (!cliente.arquivos) cliente.arquivos = [];

    renderizarArquivosCliente();
    perfilModal.classList.add('active');

    if (typeof window.renderizarPedidosCliente === 'function') setTimeout(() => window.renderizarPedidosCliente(), 100);
    if (typeof window.renderizarSelectCategorias === 'function') setTimeout(() => window.renderizarSelectCategorias(), 100);
}

function fecharPerfil() {
    const perfilModal = document.getElementById('perfilModal');
    if (perfilModal) perfilModal.classList.remove('active');
    clientePerfilId = null;
    document.getElementById('fileUploadInput').value = '';
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!clientePerfilId) return;

    if (file.size > 1.5 * 1024 * 1024) {
        mostrarToast('Selecione um arquivo de até 1.5MB.', 'error');
        document.getElementById('fileUploadInput').value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const base64Data = e.target.result;

        const cliente = obterClienteContexto();
        if (!cliente) return;
        if (!cliente.arquivos) cliente.arquivos = [];

        const isPdf = file.name.toLowerCase().endsWith('.pdf');
        const isImage = file.type.startsWith('image');
        const icon = isPdf ? 'bx-file-pdf' : (isImage ? 'bx-image' : 'bx-file-blank');

        cliente.arquivos.push({
            id: Date.now().toString(),
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            type: file.type,
            icon: icon,
            dataUrl: base64Data,
            date: new Date().toLocaleDateString('pt-BR')
        });

        try {
            if (clientePerfilTipo === 'lojista') {
                salvarPinosLocais();
            } else {
                salvarDados();
            }
            renderizarArquivosCliente();
            mostrarToast('Upload concluido!', 'success');
        } catch (error) {
            mostrarToast('Memória cheia! Exclua outros arquivos.', 'error');
            cliente.arquivos.pop();
            if (clientePerfilTipo === 'lojista') salvarPinosLocais(); else salvarDados();
        }
    };
    reader.onerror = function () {
        mostrarToast('Erro na leitura do arquivo.', 'error');
    };
    reader.readAsDataURL(file);
}

function renderizarArquivosCliente() {
    const container = document.getElementById('listaArquivosContainer');
    if (!container) return;
    container.innerHTML = '';

    const cliente = obterClienteContexto();
    if (!cliente || !cliente.arquivos || cliente.arquivos.length === 0) {
        container.innerHTML = '<p style="color:#999; font-size:13px; text-align:center; padding:10px;">Nenhum arquivo adicionado.</p>';
        return;
    }

    cliente.arquivos.forEach(arq => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.padding = '10px';
        div.style.border = '1px solid #ddd';
        div.style.borderRadius = '8px';
        div.style.marginBottom = '8px';
        div.style.backgroundColor = '#fff';

        const typeColor = arq.icon === 'bx-file-pdf' ? '#e74c3c' : (arq.icon === 'bx-image' ? '#3498db' : '#95a5a6');

        div.innerHTML = "<div style='display:flex; align-items:center; gap:10px; width:75%;'>" +
            "<i class='bx " + arq.icon + "' style='font-size:24px; color:" + typeColor + "'></i>" +
            "<div style='max-width:90%'>" +
            "<h5 style='margin:0; font-size:13px; color:#333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;'>" + arq.name + "</h5>" +
            "<p style='margin:0; font-size:11px; color:#888;'>" + arq.size + " - " + arq.date + "</p>" +
            "</div>" +
            "</div>" +
            "<div style='display:flex; gap: 8px;'>" +
            "<button title='Baixar / Visualizar' class='action-btn' onclick='visualizarArquivo(\"" + arq.id + "\")' style='color:var(--primary-color)'><i class='bx bx-cloud-download'></i></button>" +
            "<button title='Excluir Arquivo' class='action-btn delete' onclick='deletarArquivo(\"" + arq.id + "\")'><i class='bx bx-trash'></i></button>" +
            "</div>";

        container.appendChild(div);
    });
}

function visualizarArquivo(idArq) {
    const cliente = obterClienteContexto();
    if (!cliente || !cliente.arquivos) return;
    const arq = cliente.arquivos.find(a => a.id === idArq);
    if (!arq) return;

    fetch(arq.dataUrl)
        .then(res => res.blob())
        .then(blob => {
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = arq.name;
            link.click();
            window.URL.revokeObjectURL(link.href);
            mostrarToast('Iniciando download...', 'info');
        });
}

function deletarArquivo(idArq) {
    if (!confirm('Certeza que quer apagar definitivamente este arquivo?')) return;

    const cliente = obterClienteContexto();
    if (!cliente || !cliente.arquivos) return;

    cliente.arquivos = cliente.arquivos.filter(a => a.id !== idArq);
    if (clientePerfilTipo === 'lojista') {
        salvarPinosLocais();
    } else {
        salvarDados();
    }
    renderizarArquivosCliente();
    mostrarToast('Arquivo excluido!', 'success');
}

window.abrirPerfilCliente = abrirPerfilCliente;
window.fecharPerfil = fecharPerfil;
window.handleFileUpload = handleFileUpload;
window.visualizarArquivo = visualizarArquivo;
window.deletarArquivo = deletarArquivo;

// ==========================================
// MÓDULO DE GERENCIAMENTO DE CATEGORIAS
// ==========================================
window.categoriasSalvas = ['Pias de Granito', 'Louças e Metais', 'Porcelanato', 'Tintas'];

window.renderizarSelectCategorias = function() {
    const sel = document.getElementById('pedidoCategoria');
    if (!sel) return;
    
    let cats = JSON.parse(localStorage.getItem('nexus_categorias_' + getUserPrefix()));
    if(!cats) cats = window.categoriasSalvas;
    
    const valObj = sel.value;
    
    sel.innerHTML = '<option value="">Selecione a Categoria</option>';
    cats.forEach(c => {
        sel.innerHTML += '<option value="' + c + '">' + c + '</option>';
    });
    
    if(valObj) {
        sel.value = valObj;
    }
}

const originalAbrirPerfilClienteCat = window.abrirPerfilCliente;
window.abrirPerfilCliente = function(id, tipoContexto = 'empresa') {
    originalAbrirPerfilClienteCat(id, tipoContexto);
    setTimeout(() => {
        if(typeof renderizarSelectCategorias === 'function') {
            renderizarSelectCategorias();
        }
    }, 100);
}

window.abrirModalNovaCategoria = function() {
    const mdl = document.getElementById('categoriaModal');
    if(mdl) mdl.classList.add('active');
    const inp = document.getElementById('novaCategoriaNome');
    if(inp) {
        inp.value = '';
        setTimeout(() => inp.focus(), 100);
    }
}

window.fecharModalNovaCategoria = function() {
    const mdl = document.getElementById('categoriaModal');
    if(mdl) mdl.classList.remove('active');
}

window.salvarNovaCategoria = function() {
    const input = document.getElementById('novaCategoriaNome');
    if(!input) return;
    const val = input.value.trim();
    
    if (!val) { 
        mostrarToast('Informe o nome da categoria.', 'error'); 
        return; 
    }
    
    let cats = JSON.parse(localStorage.getItem('nexus_categorias_' + getUserPrefix()));
    if(!cats) cats = window.categoriasSalvas;
    
    const exactMatchStr = cats.find(c => c.toLowerCase() === val.toLowerCase());
    if (!exactMatchStr) {
        cats.push(val);
        cats.sort();
        localStorage.setItem('nexus_categorias_' + getUserPrefix(), JSON.stringify(cats));
        mostrarToast('Categoria salva!', 'success');
    } else {
        mostrarToast('Categoria já existe!', 'info');
    }
    
    window.categoriasSalvas = cats;
    renderizarSelectCategorias();
    fecharModalNovaCategoria();
    
    const sel = document.getElementById('pedidoCategoria');
    if (sel) {
        sel.value = exactMatchStr || val;
    }
}


window.filtrarListaDeLojistas = function () {
    renderizarListaLojistasLateral();
}

// Hook into existing function to update list when map is shown
const originalMostrarMapa2 = window.mostrarMapa;
window.mostrarMapa = function () {
    if (typeof originalMostrarMapa2 === 'function') originalMostrarMapa2();
    const linkClientes = document.getElementById("linkClientes");
    if (linkClientes) {
        document.querySelectorAll(".nav-links a").forEach(l => l.classList.remove("active"));
        linkClientes.classList.add("active");
    }
    setTimeout(() => {
        if (typeof renderizarListaLojistasLateral === 'function') {
            renderizarListaLojistasLateral();
        }
    }, 200);
}

// Hook into salvarPinosLocais to update list
const originalSalvarPinosLocais = window.salvarPinosLocais;
window.salvarPinosLocais = function () {
    if (typeof originalSalvarPinosLocais === 'function') originalSalvarPinosLocais();
    if (typeof renderizarListaLojistasLateral === 'function') renderizarListaLojistasLateral();
}

window.mostrarClientes = function () {
    const mainColumn = document.getElementById('mainColumn');
    const iframeColumn = document.getElementById('iframeColumn');
    const mapColumn = document.getElementById('mapColumn');
    const clientesColumn = document.getElementById('clientesColumn');

    if (mainColumn) mainColumn.style.display = 'none';
    if (iframeColumn) iframeColumn.style.display = 'none';
    if (mapColumn) mapColumn.style.display = 'none';
    if (clientesColumn) clientesColumn.style.display = 'block';

    document.getElementById("dashboardTitle").innerText = "Meus Clientes";

    document.querySelectorAll(".nav-links a").forEach(l => l.classList.remove("active"));
    const linkClientes = document.getElementById("linkClientes");
    if (linkClientes) linkClientes.classList.add("active");

    if (typeof renderizarListaLojistasLateral === 'function') {
        renderizarListaLojistasLateral();
    }
}

window.filtrarListaDeLojistas = function () {
    renderizarListaLojistasLateral();
}

window.renderizarListaLojistasLateral = function () {
    const listContainer = document.getElementById('listaLojistasLateral');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const inputPesquisa = document.getElementById('pesquisaLojista');
    const termo = inputPesquisa ? inputPesquisa.value.toLowerCase().trim() : '';

    const selectFiltro = document.getElementById('filtroTipoLojista');
    const tipoFiltro = selectFiltro ? selectFiltro.value : 'nome';

    let filtrados = locaisLojistas || [];

    // Reverse Geocoding is not natively provided easily if there's no stored "cidade" property
    // We will assume "cidade" might be loosely stored in `obs` or the user might implement a check
    // Actually, CNPJ could be in `obs`. So CNPJ will look in obs or cnpj props.
    if (termo) {
        filtrados = filtrados.filter(l => {
            const obsStr = l.obs ? l.obs.toLowerCase() : '';
            const nomeStr = l.nome ? l.nome.toLowerCase() : '';
            const cnpjStr = l.cnpj ? l.cnpj.toLowerCase() : '';
            const contatoStr = l.contato ? l.contato.toLowerCase() : '';

            if (tipoFiltro === 'nome') {
                return nomeStr.includes(termo) || contatoStr.includes(termo);
            } else if (tipoFiltro === 'cnpj') {
                const termClean = termo.replace(/[^0-9]/g, '');
                if (termClean.length > 0) {
                    const obsClean = obsStr.replace(/[^0-9]/g, '');
                    const cnpjClean = cnpjStr.replace(/[^0-9]/g, '');
                    return obsClean.includes(termClean) || cnpjClean.includes(termClean);
                }
                return obsStr.includes(termo) || cnpjStr.includes(termo);
            } else if (tipoFiltro === 'cidade') {
                // Since cidade might be in observations, we just search the observations for it
                return obsStr.includes(termo);
            }
            return false;
        });
    }

    if (filtrados.length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; padding: 20px; font-size: 13px; color: #888; grid-column: 1 / -1;">Nenhum cliente/lojista encontrado com este filtro.</div>';
        return;
    }

    // Ordenar alfabeticamente
    filtrados.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

    filtrados.forEach(cliente => {
        const div = document.createElement("div");
        div.style.background = "#fff";
        div.style.border = "1px solid rgba(0,0,0,0.08)";
        div.style.borderRadius = "8px";
        div.style.padding = "15px";
        div.style.display = "flex";
        div.style.flexDirection = "column";
        div.style.gap = "8px";
        div.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
        div.style.transition = "all 0.2s";

        let statusColor = cliente.status === 'ativo' ? '#2ecc71' : cliente.status === 'prospect' ? '#f39c12' : '#e74c3c';

        let cnpjEncontrado = '';
        if (cliente.obs && cliente.obs.includes('CNPJ:')) {
            const r = cliente.obs.match(/CNPJ:\s*([^\n]+)/);
            if (r) cnpjEncontrado = r[1];
        } else if (cliente.cnpj) {
            cnpjEncontrado = cliente.cnpj;
        }

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h5 style="margin:0; font-size:14px; color:#333; font-weight:700;">${cliente.nome}</h5>
                </div>
                <span title="${(cliente.status || '').toUpperCase()}" style="width:12px; height:12px; border-radius:50%; background:${statusColor}; display:inline-block; flex-shrink:0;"></span>
            </div>
            ${cnpjEncontrado ? `<div style="font-size:12px; color:#666; display:flex; align-items:center; gap:5px;"><i class='bx bx-id-card' style="color:var(--primary-color);"></i> CNPJ: ${cnpjEncontrado}</div>` : ''}
            ${cliente.contato ? `<div style="font-size:12px; color:#666; display:flex; align-items:center; gap:5px;"><i class='bx bx-phone' style="color:var(--primary-color);"></i> Contato: ${cliente.contato}</div>` : ''}
            ${cliente.obs && !cliente.obs.startsWith('CNPJ:') && cliente.obs.length > 20 ? `<div style="font-size:11px; color:#999; margin-top:2px; font-style:italic;">Info: ${cliente.obs.substring(0, 45)}...</div>` : ''}
            
            <div style="display:flex; gap: 8px; margin-top: 10px;">
                <button onclick="abrirPerfilCliente('${cliente.id}', 'lojista')" style="flex:1; background:rgba(255,107,0,0.1); color:#ff6b00; border:none; padding:8px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600;"><i class='bx bx-folder-open'></i> Ver Arquivos / Pedidos</button>
            </div>
        `;
        listContainer.appendChild(div);
    });
}
window.baixarAnexoPedido = function (idPedido) {
    const cliente = obterClienteContexto();
    if (!cliente || !cliente.pedidos) return;

    const ped = cliente.pedidos.find(p => p.id === idPedido);
    if (!ped || !ped.fileData) {
        mostrarToast("Anexo não encontrado.", "error");
        return;
    }

    fetch(ped.fileData)
        .then(res => res.blob())
        .then(blob => {
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = ped.fileName || 'pedido_anexo';
            link.click();
            window.URL.revokeObjectURL(link.href);
            mostrarToast("Download iniciado!", "success");
        })
        .catch(err => {
            mostrarToast("Erro ao baixar anexo.", "error");
            console.error(err);
        });
}
// ==========================================
// MÓDULO DE PEDIDOS 
// ==========================================
window.adicionarPedido = function() {
    const cliente = obterClienteContexto();
    if (!cliente) return;
    
    if (!cliente.pedidos) cliente.pedidos = [];
    
    const fileInput = document.getElementById('pedidoFileInput');
    const catSel = document.getElementById('pedidoCategoria');
    if(!catSel.value) { mostrarToast('Selecione uma categoria.', 'error'); return; }
    
    const file = fileInput.files[0];
    const dt = new Date().toISOString(); 
    
    const concluirAdicaoPedido = () => {
        if(clientePerfilTipo === 'lojista') salvarPinosLocais(); else salvarDados();
        if(typeof window.renderizarPedidosCliente === 'function') window.renderizarPedidosCliente();
        fileInput.value = '';
        document.getElementById('pedidoFileName').innerText = 'Escolher PDF';
        catSel.value = '';
        mostrarToast('Pedido adicionado!', 'success');
        if (typeof window.verificarLembretes === 'function') setTimeout(window.verificarLembretes, 100);
    };

    if (file) {
        if (file.size > 1.5 * 1024 * 1024) { mostrarToast('Arquivo muito grande.', 'error'); return; }
        const r = new FileReader();
        r.onload = function(e){
            cliente.pedidos.push({
                id: Date.now().toString(),
                categoria: catSel.value,
                data: dt,
                fileName: file.name,
                fileData: e.target.result
            });
            concluirAdicaoPedido();
        };
        r.readAsDataURL(file);
    } else {
        cliente.pedidos.push({
            id: Date.now().toString(),
            categoria: catSel.value,
            data: dt,
            fileName: '',
            fileData: ''
        });
        concluirAdicaoPedido();
    }
}

window.renderizarPedidosCliente = function() {
    const list = document.getElementById('listaPedidosContainer');
    if (!list) return;
    list.innerHTML = '';
    
    const cliente = obterClienteContexto();
    if(!cliente || !cliente.pedidos || cliente.pedidos.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#999;font-size:12px;">Nenhum pedido no histórico.</p>';
        return;
    }
    
    const pedidosSorted = [...cliente.pedidos].sort((a,b) => new Date(b.data) - new Date(a.data));
    pedidosSorted.forEach(p => {
        const d = new Date(p.data);
        const div = document.createElement('div');
        div.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:10px; border:1px solid #eee; border-radius:8px; margin-bottom:8px; background:#fff;';
        
        const infoDiv = document.createElement('div');
        infoDiv.innerHTML = '<strong style="font-size:13px;color:#333;">' + p.categoria + '</strong><div style="font-size:11px;color:#888;">' + d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR').substring(0,5) + '</div>';
        
        const btnDiv = document.createElement('div');
        btnDiv.style.cssText = 'display:flex; gap:8px;';
        
        if (p.fileData) {
            const btnD = document.createElement('button');
            btnD.style.cssText = 'background:none;border:none;color:var(--primary-color);cursor:pointer;';
            btnD.innerHTML = "<i class='bx bx-download'></i> Baixar";
            btnD.onclick = () => window.baixarAnexoPedido(p.id);
            btnDiv.appendChild(btnD);
        }
        
        const btnDel = document.createElement('button');
        btnDel.style.cssText = 'background:none;border:none;color:red;cursor:pointer;';
        btnDel.innerHTML = "<i class='bx bx-trash'></i>";
        btnDel.onclick = () => window.deletarPedido(p.id);
        
        btnDiv.appendChild(btnDel);
        div.appendChild(infoDiv);
        div.appendChild(btnDiv);
        
        list.appendChild(div);
    });
}

window.deletarPedido = function(id) {
    if(!confirm('Deseja excluir o pedido?')) return;
    const cliente = obterClienteContexto();
    cliente.pedidos = cliente.pedidos.filter(p => p.id !== id);
    if(clientePerfilTipo === 'lojista') salvarPinosLocais(); else salvarDados();
    renderizarPedidosCliente();
    if (typeof window.verificarLembretes === 'function') window.verificarLembretes();
}

window.atualizarNomeArquivo = function(input) {
    if(input.files && input.files.length > 0) {
        document.getElementById('pedidoFileName').innerText = input.files[0].name.substring(0, 15) + '...';
    } else {
        document.getElementById('pedidoFileName').innerText = 'Escolher PDF';
    }
}

// ==========================================
// MÓDULO DE FOCAR MAPA BUSCA
// ==========================================
const originalFiltrarPinosMapa = window.filtrarPinosMapa;
window.filtrarPinosMapa = function() {
    const input = document.getElementById('pesquisaMapaInput');
    if (!input || !map) return;
    const termo = input.value.toLowerCase().trim();
    if(!termo) {
        map.setView([-14.235, -51.925], 4);
        renderizarPinosNoMapa();
        return;
    }
    
    // Check if original is available (it might not be in cleaned version!)
    // Let's implement full clear and re-render of matched 
    if (pinsLayer) pinsLayer.clearLayers();
    
    const filtrados = locaisLojistas.filter(l => 
        (l.nome && l.nome.toLowerCase().includes(termo)) || 
        (l.obs && l.obs.toLowerCase().includes(termo)) ||
        (l.cnpj && l.cnpj.includes(termo))
    );
    
    filtrados.forEach(local => {
        const marker = L.marker([local.lat, local.lng], { icon: obterIconePin(local.status) });
        marker.bindPopup("<div style='min-width: 150px; padding: 5px; font-family: Inter, sans-serif;'><h4 style='margin:0 0 5px 0; color:#333; font-size:14px;'>" + local.nome + "</h4><p style='margin:0; font-size:12px; color:#666;'><strong>Situação:</strong> " + local.status.toUpperCase() + "</p><div style='margin-top: 10px; text-align: right;'><button class='btn-secondary' style='font-size:11px; padding:3px 8px; border-radius:4px; cursor:pointer;' onclick='prepararEdicaoPin(\"" + local.id + "\"); return false;'>Editar / Excluir</button></div></div>");
        pinsLayer.addLayer(marker);
    });
    
    if(filtrados.length === 1) {
        map.setView([filtrados[0].lat, filtrados[0].lng], 15);
    } else if(filtrados.length > 1) {
        const bounds = L.latLngBounds(filtrados.map(l => [l.lat, l.lng]));
        map.fitBounds(bounds, {padding: [50, 50]});
    } else {
        // Fallback to nominatim
        // Try searching city or region
        fetch("https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(termo + ", Brasil"))
            .then(res => res.json())
            .then(data => {
                if(data && data.length > 0) {
                    map.setView([parseFloat(data[0].lat), parseFloat(data[0].lon)], 12);
                    mostrarToast("Mostrando cidade/regiao (" + termo + "). Nenhum lojista encontrado aqui ainda.", "info");
                } else {
                    mostrarToast("Nenhum local ou lojista encontrado para: " + termo, "error");
                }
            }).catch(console.error);
    }
}

// ==========================================
// ALERTAS 25, 35, 45 DIAS 
// ==========================================
window.verificarLembretes = function() {
    const badge25 = document.getElementById('badgeAlertas');
    const badge35 = document.getElementById('badgeAlertas35');
    const badge45 = document.getElementById('badgeAlertas45');
    
    if(!badge25 || !badge35 || !badge45) return;
    
    let a25 = [], a35 = [], a45 = [];
    
    const hoje = new Date();
    
    const analisar = (cliente, tipo) => {
        if(!cliente.pedidos || cliente.pedidos.length === 0) return;
        let cats = {};
        cliente.pedidos.forEach(p => {
            const dt = new Date(p.data);
            if(!cats[p.categoria] || dt > cats[p.categoria]) {
                cats[p.categoria] = dt;
            }
        });
        
        for(const cat in cats) {
            const diasStr = (hoje - cats[cat]) / (1000 * 3600 * 24);
            const diasFormated = Math.floor(diasStr);
            if(diasFormated >= 45) {
                a45.push({ nome: cliente.nome, id: cliente.id, dias: diasFormated, cat: cat, tipo: tipo });
            } else if(diasFormated >= 35) {
                a35.push({ nome: cliente.nome, id: cliente.id, dias: diasFormated, cat: cat, tipo: tipo });
            } else if(diasFormated >= 25) {
                a25.push({ nome: cliente.nome, id: cliente.id, dias: diasFormated, cat: cat, tipo: tipo });
            }
        }
    }
    
    empresas.forEach(emp => analisar(emp, 'empresa'));
    locaisLojistas.forEach(loj => analisar(loj, 'lojista'));
    
    const render = (arr, elId, badge, color) => {
        const div = document.getElementById(elId);
        badge.innerText = arr.length;
        if(arr.length === 0) {
            div.innerHTML = '<div style="text-align:center; padding: 5px; font-style: italic;">Nenhum alerta.</div>';
            return;
        }
        div.innerHTML = '';
        arr.sort((a,b)=>b.dias - a.dias).forEach(item => {
            const d = document.createElement('div');
            d.style.cssText = 'background:rgba(255,255,255,0.7); color:#333; padding:8px; border-radius:6px; cursor:pointer; font-weight:600; border-left:3px solid ' + color + '; margin-bottom: 5px; box-shadow:0 1px 2px rgba(0,0,0,0.05); transition:background 0.2s;';
            d.innerHTML = '🔥 ' + item.cat + ' (' + item.dias + ' dias) <br><span style="font-weight:400; font-size:10px; color:#666;">' + item.nome + '</span>';
            d.onclick = () => window.abrirPerfilCliente(item.id, item.tipo);
            div.appendChild(d);
        });
    }
    
    render(a25, 'listaAlertas', badge25, '#2ecc71');
    render(a35, 'listaAlertas35', badge35, '#f39c12');
    render(a45, 'listaAlertas45', badge45, '#e74c3c');
}

const originalAtualizarDashboard = window.atualizarDashboard;
window.atualizarDashboard = function() {
    if(typeof originalAtualizarDashboard === 'function') originalAtualizarDashboard();
    if(typeof window.verificarLembretes === 'function') setTimeout(window.verificarLembretes, 100);
}

const orgAbrirPerfilCliente = window.abrirPerfilCliente;
window.abrirPerfilCliente = function(id, tipoContexto = 'empresa') {
    if (typeof orgAbrirPerfilCliente === 'function') orgAbrirPerfilCliente(id, tipoContexto);
    if (typeof window.renderizarPedidosCliente === 'function') setTimeout(() => window.renderizarPedidosCliente(), 100);
}

// Initialize on load just to be sure
setTimeout(() => { if(typeof window.verificarLembretes === 'function') window.verificarLembretes(); }, 500);

// HACKS PARA MOBILE / RESPONSIVO
document.addEventListener('click', function(e) {
    const sidebar = document.querySelector('.sidebar');
    const sidebarBtn = document.querySelector('.sidebarBtn');
    
    // Se o clique foi fora da sidebar e a sidebar está ativa (e estamos no mobile)...
    if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
        // Verifica se clicou no botão de abrir ou dentro da sidebar
        if (!sidebar.contains(e.target) && !sidebarBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    }
});


// FUNCAO EM FALTA ADICIONADA: Cadastrar via CNPJ no MAPA
window.abrirModalNovoClienteMapa = function() {
    // Se o usuario quiser cadastrar um cliente sem clicar no mapa,
    // pedimos para ele colocar pelo menos o CNPJ, e depois resolvemos a coordenada.
    document.getElementById("pinId").value = "";
    document.getElementById("pinLat").value = "";
    document.getElementById("pinLng").value = "";
    document.getElementById("pinCnpj").value = "";
    document.getElementById("pinNome").value = "";
    document.getElementById("pinContato").value = "";
    document.getElementById("pinStatus").value = "ativo";
    document.getElementById("pinObs").value = "";
    
    document.getElementById("btnDeletePinContainer").style.display = "none";
    document.getElementById("pinModalTitle").innerText = "Cadastrar Cliente Via CNPJ";
    document.getElementById("pinModal").classList.add("active");
};

// FUNCAO DE BUSCAR DADOS PELO CNPJ NA API PBLICA
document.getElementById('pinCnpj').addEventListener('blur', async function() {
    let cnpj = this.value.replace(/[^0-9]/g, '');
    if(cnpj.length === 14) {
        try {
            const response = await fetch(`https://api.cnpjs.dev/v1/${cnpj}`);
            if(response.ok) {
                const data = await response.json();
                if(data.razao_social) {
                   document.getElementById('pinNome').value = data.nome_fantasia || data.razao_social;
                }
                if(data.telefone1) {
                    document.getElementById('pinContato').value = data.telefone1;
                }
                
                // Pega endereço para geolocalização ou salvar na obs
                let enderecoCompleto = '';
                if(data.endereco) {
                    enderecoCompleto = `${data.endereco.logradouro}, ${data.endereco.municipio} - ${data.endereco.uf}`;
                    document.getElementById('pinObs').value = `CNPJ: ${cnpj}\nEndereço: ${enderecoCompleto}`;
                }

                mostrarToast("CNPJ Localizado!", "success");
            } else {
                 mostrarToast("CNPJ no localizado na base.", "error");
            }
        } catch(error) {
            console.error("Erro na busca de CNPJ:", error);
        }
    }
});

// FUNCAO ATUALIZADA: Suporte a Cadastro por CNPJ (sem LAT/LNG inicial)
window.salvarLojistaLocal = async function(e) {
    e.preventDefault();
    const nome = document.getElementById("pinNome").value.trim();
    if (!nome) return;

    let latStr = document.getElementById("pinLat").value;
    let lngStr = document.getElementById("pinLng").value;

    // Se estiver cadastrando via CNPJ sem clicar no mapa, precisamos das coordenadas
    if (!latStr || !lngStr || latStr === "undefined" || lngStr === "undefined") {
        const cnpjStr = document.getElementById("pinCnpj").value.trim();
        const obsStr = document.getElementById("pinObs").value;
        const cidadeQuery = document.getElementById("pesquisaMapaInput") ? document.getElementById("pesquisaMapaInput").value : "";
        
        let queryParaGeocoding = nome; // fallback

        // Tenta achar cidade/uf no endereco que foi pego via API
        let enderecoViaApi = "";
        if (obsStr && obsStr.includes("Endereço:")) {
             enderecoViaApi = obsStr.split("Endereço:")[1].trim();
             queryParaGeocoding = enderecoViaApi;
        } else if (cidadeQuery) {
             queryParaGeocoding = cidadeQuery;
        }

        mostrarToast("Buscando localização no mapa...", "info");
        
        try {
            const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryParaGeocoding + ', Brazil')}&limit=1`;
            const geoRes = await fetch(geocodeUrl);
            const geoData = await geoRes.json();
            
            if (geoData && geoData.length > 0) {
                latStr = geoData[0].lat;
                lngStr = geoData[0].lon;
            } else {
                // Se nao achar o endereco com precisao, joga no centro de br
                latStr = -14.235;
                lngStr = -51.925;
                mostrarToast("Endereço não encontrado exatamente, posicionado no centro do mapa. Arraste depois.", "warning");
            }
        } catch (err) {
            console.error(err);
            latStr = -14.235;
            lngStr = -51.925;
        }
    }

    const cnpjFormatado = document.getElementById("pinCnpj") ? document.getElementById("pinCnpj").value.trim() : "";

    const novoPin = {
        id: (typeof editandoPinId !== 'undefined' && editandoPinId) ? editandoPinId : Date.now().toString(),
        nome: nome,
        contato: document.getElementById("pinContato").value.trim(),
        cnpj: cnpjFormatado, // Adicionando propriedade cnpj
        status: document.getElementById("pinStatus").value,
        obs: document.getElementById("pinObs").value.trim(),
        lat: parseFloat(latStr),
        lng: parseFloat(lngStr),
        data: new Date().toISOString()
    };

    if (typeof editandoPinId !== 'undefined' && editandoPinId) {
        const index = locaisLojistas.findIndex(l => l.id === editandoPinId);
        if (index > -1) {
            locaisLojistas[index] = novoPin;
        }
        mostrarToast("Local atualizado com sucesso!", "success");
    } else {
        locaisLojistas.push(novoPin);
        mostrarToast("Lojista adicionado no mapa!", "success");
    }

    if(typeof salvarPinosLocais === 'function') salvarPinosLocais();
    if(typeof fecharModalPin === 'function') fecharModalPin();
    if(typeof map !== 'undefined' && map.closePopup) map.closePopup();
};


