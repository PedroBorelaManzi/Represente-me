// ==========================================
// MÃ“DULO DE PERFIL / ARQUIVOS
// ==========================================


function abrirPerfilCliente(id) {
    const emp = empresas.find(e => e.id === id);
    if (!emp) return;

    clientePerfilId = id;

    const perfilModal = document.getElementById("perfilModal");
    if (!perfilModal) return;

    document.getElementById("perfilNome").innerText = emp.nome;
    document.getElementById("perfilCNPJ").innerText = emp.cnpj && emp.cnpj !== "-" ? "CNPJ: " + emp.cnpj : "Sistema / Site / Prospect";

    if (!emp.arquivos) emp.arquivos = [];

    renderizarArquivosCliente();
    perfilModal.classList.add("active");
}

function fecharPerfil() {
    const perfilModal = document.getElementById("perfilModal");
    if (perfilModal) perfilModal.classList.remove("active");
    clientePerfilId = null;
    document.getElementById('fileUploadInput').value = '';
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!clientePerfilId) return;

    // Limite de memoria local (1.5MB) pre-evita o QuotaExceededError
    if (file.size > 1.5 * 1024 * 1024) {
        mostrarToast("Selecione um arquivo de atÃ© 1.5MB.", "error");
        document.getElementById('fileUploadInput').value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const base64Data = e.target.result;

        const emp = empresas.find(e => e.id === clientePerfilId);
        if (!emp.arquivos) emp.arquivos = [];

        const isPdf = file.name.toLowerCase().endsWith('.pdf');
        const isImage = file.type.startsWith('image');
        const icon = isPdf ? 'bx-file-pdf' : (isImage ? 'bx-image' : 'bx-file-blank');

        emp.arquivos.push({
            id: Date.now().toString(),
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            type: file.type,
            icon: icon,
            dataUrl: base64Data,
            date: new Date().toLocaleDateString('pt-BR')
        });

        try {
            salvarDados();
            renderizarArquivosCliente();
            mostrarToast("Upload concluido!", "success");
        } catch (error) {
            mostrarToast("MemÃ³ria cheia! Exclua outros arquivos.", "error");
            emp.arquivos.pop();
        }
    };
    reader.onerror = function () {
        mostrarToast("Erro na leitura do arquivo.", "error");
    };
    reader.readAsDataURL(file);
}

function renderizarArquivosCliente() {
    const container = document.getElementById("listaArquivosContainer");
    if (!container) return;
    container.innerHTML = "";

    const emp = empresas.find(e => e.id === clientePerfilId);
    if (!emp || !emp.arquivos || emp.arquivos.length === 0) {
        container.innerHTML = "<p style='color:#999; font-size:13px; text-align:center; padding:10px;'>Nenhum arquivo adicionado.</p>";
        return;
    }

    emp.arquivos.forEach(arq => {
        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.alignItems = "center";
        div.style.padding = "10px";
        div.style.border = "1px solid #ddd";
        div.style.borderRadius = "8px";
        div.style.marginBottom = "8px";
        div.style.backgroundColor = "#fff";

        const typeColor = arq.icon === 'bx-file-pdf' ? '#e74c3c' : (arq.icon === 'bx-image' ? '#3498db' : '#95a5a6');

        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; width:75%;">
                <i class='bx ${arq.icon}' style='font-size:24px; color:${typeColor}'></i>
                <div style="max-width:90%">
                    <h5 style="margin:0; font-size:13px; color:#333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${arq.name}</h5>
                    <p style="margin:0; font-size:11px; color:#888;">${arq.size} - ${arq.date}</p>
                </div>
            </div>
            <div style="display:flex; gap: 8px;">
                <button title="Baixar / Visualizar" class="action-btn" onclick="visualizarArquivo('${arq.id}')" style="color:var(--primary-color)"><i class='bx bx-cloud-download'></i></button>
                <button title="Excluir Arquivo" class="action-btn delete" onclick="deletarArquivo('${arq.id}')"><i class='bx bx-trash'></i></button>
            </div>
        `;
        container.appendChild(div);
    });
}

function visualizarArquivo(idArq) {
    const emp = empresas.find(e => e.id === clientePerfilId);
    if (!emp || !emp.arquivos) return;
    const arq = emp.arquivos.find(a => a.id === idArq);
    if (!arq) return;

    // Converter de volta em Blob para forÃ§ar o Download em vez de travar o popup do chrome
    fetch(arq.dataUrl)
        .then(res => res.blob())
        .then(blob => {
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = arq.name;
            link.click();
            window.URL.revokeObjectURL(link.href);
            mostrarToast("Iniciando visualizaÃ§Ã£o/download...", "info");
        });
}

function deletarArquivo(idArq) {
    if (!confirm("Certeza que quer apagar definitivamente este arquivo?")) return;

    const emp = empresas.find(e => e.id === clientePerfilId);
    if (!emp || !emp.arquivos) return;

    emp.arquivos = emp.arquivos.filter(a => a.id !== idArq);
    salvarDados();
    renderizarArquivosCliente();
    mostrarToast("Arquivo excluÃ­do.", "success");
}

window.abrirPerfilCliente = abrirPerfilCliente;
window.fecharPerfil = fecharPerfil;
window.handleFileUpload = handleFileUpload;
window.visualizarArquivo = visualizarArquivo;
window.deletarArquivo = deletarArquivo;
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

        div.innerHTML = 
            <div style="display:flex; align-items:center; gap:10px; width:75%;">
                <i class='bx \' style='font-size:24px; color:\'></i>
                <div style="max-width:90%">
                    <h5 style="margin:0; font-size:13px; color:#333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">\</h5>
                    <p style="margin:0; font-size:11px; color:#888;">\ - \</p>
                </div>
            </div>
            <div style="display:flex; gap: 8px;">
                <button title="Baixar / Visualizar" class="action-btn" onclick="visualizarArquivo('\')" style="color:var(--primary-color)"><i class='bx bx-cloud-download'></i></button>
                <button title="Excluir Arquivo" class="action-btn delete" onclick="deletarArquivo('\')"><i class='bx bx-trash'></i></button>
            </div>
        ;
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

