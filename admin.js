// admin.js - painel admin para Supabase
(async () => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.__SUPABASE_CONFIG;
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


  // elementos
  const authSection = document.getElementById('authSection');
  const panelSection = document.getElementById('panelSection');
  const btnLogin = document.getElementById('btnLogin');
  const btnLogout = document.getElementById('btnLogout');
  const authMsg = document.getElementById('authMsg');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const userActions = document.getElementById('userActions');
  const userEmail = document.getElementById('userEmail');

  const productForm = document.getElementById('productForm');
  const produtosList = document.getElementById('produtosList');
  const btnSave = document.getElementById('btnSave');
  const btnCancel = document.getElementById('btnCancel');

  const fields = {
    id: document.getElementById('productId'),
    nome: document.getElementById('nome'),
    descricao: document.getElementById('descricao'),
    preco_tipo: document.getElementById('preco_tipo'),
    preco: document.getElementById('preco'),
    frete_tipo: document.getElementById('frete_tipo'),
    frete_valor: document.getElementById('frete_valor'),
    imagem_file: document.getElementById('imagem_file'),
    status: document.getElementById('status')
  };

  // verifica sessão
  async function checkSession(){
    const { data } = await supabase.auth.getSession();
    const session = data?.session;
    if(session){
      showPanel(session.user.email);
    } else {
      showLogin();
    }
  }

  function showLogin(){
    authSection.style.display = 'block';
    panelSection.style.display = 'none';
    userActions.style.display = 'none';
  }

  function showPanel(email){
    authSection.style.display = 'none';
    panelSection.style.display = 'block';
    userActions.style.display = 'flex';
    userEmail.textContent = email;
    loadProducts();
  }

  // login
  btnLogin.addEventListener('click', async () => {
    authMsg.textContent = 'Acessando...';
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if(error) throw error;
      authMsg.textContent = 'Logado com sucesso!';
      setTimeout(() => authMsg.textContent = '', 1500);
      showPanel(email);
    } catch (err) {
      authMsg.textContent = 'Erro: ' + (err.message || err);
    }
  });

  // logout
  btnLogout?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    showLogin();
  });

  // salvar produto (create / update)
  btnSave.addEventListener('click', async () => {
    btnSave.disabled = true;
    btnSave.textContent = 'Salvando...';

    const id = fields.id.value || null;
    const payload = {
      nome: fields.nome.value.trim(),
      descricao: fields.descricao.value.trim(),
      preco_tipo: fields.preco_tipo.value,
      preco: fields.preco.value ? Number(fields.preco.value) : null,
      frete_tipo: fields.frete_tipo.value,
      frete_valor: fields.frete_valor.value ? Number(fields.frete_valor.value) : null,
      status: fields.status.value
    };

    try {
      // se há arquivo novo, faz upload
      let imagem_url = null;
      const fileInput = fields.imagem_file;
      if(fileInput.files && fileInput.files.length > 0){
        const file = fileInput.files[0];
        const fileName = `${Date.now()}_${file.name.replace(/\s+/g,'_')}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('produtos')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });
        if(uploadErr) throw uploadErr;
        const { data: publicData } = supabase.storage.from('produtos').getPublicUrl(fileName);
        imagem_url = publicData.publicUrl;
      }

      // se for edição
      if(id){
        // se trocou imagem -> atualizar campo
        const updates = { ...payload, atualizado_em: new Date() };
        if(imagem_url) updates.imagem_url = imagem_url;
        const { error: upErr } = await supabase.from('produtos').update(updates).eq('id', id);
        if(upErr) throw upErr;
      } else {
        // inserir (imagem obrigatória)
        if(!imagem_url) throw new Error('Envie uma imagem para o produto.');
        const row = { ...payload, imagem_url };
        const { error: insErr } = await supabase.from('produtos').insert(row);
        if(insErr) throw insErr;
      }

      resetForm();
      loadProducts();
    } catch(err){
      alert('Erro: ' + (err.message || err));
      console.error(err);
    } finally {
      btnSave.disabled = false;
      btnSave.textContent = '💾 Salvar';
    }
  });

  btnCancel.addEventListener('click', resetForm);

  function resetForm(){
    fields.id.value = '';
    fields.nome.value = '';
    fields.descricao.value = '';
    fields.preco_tipo.value = 'valor';
    fields.preco.value = '';
    fields.frete_tipo.value = 'gratis';
    fields.frete_valor.value = '';
    fields.imagem_file.value = '';
    fields.status.value = 'estoque';
  }

  // carregar produtos
  async function loadProducts(){
    produtosList.innerHTML = 'Carregando...';
    const { data, error } = await supabase.from('produtos').select('*').order('criado_em', { ascending: false }).limit(200);
    if(error){ produtosList.innerHTML = 'Erro ao carregar produtos.'; console.error(error); return; }
    if(!data || data.length === 0){ produtosList.innerHTML = '<em>Nenhum produto cadastrado.</em>'; return; }

    produtosList.innerHTML = '';
    data.forEach(p => {
      const item = document.createElement('div');
      item.className = 'prod-item';

      const thumb = document.createElement('img');
      thumb.className = 'prod-thumb';
      thumb.src = p.imagem_url || '';
      thumb.alt = p.nome || 'Imagem';

      const info = document.createElement('div');
      info.className = 'prod-info';
      const h = document.createElement('h4');
      h.textContent = p.nome;
      const d = document.createElement('p');
      d.innerHTML = `${p.descricao.substring(0,120)}<br><strong>Status:</strong> ${p.status} | <strong>Preço:</strong> ${p.preco_tipo === 'valor' ? (p.preco ? 'R$ ' + Number(p.preco).toFixed(2) : '-') : 'A combinar' }`;

      info.appendChild(h); info.appendChild(d);

      const actions = document.createElement('div');
      actions.className = 'prod-actions';

      const btnEdit = document.createElement('button');
      btnEdit.className = 'small-btn';
      btnEdit.textContent = 'Editar';
      btnEdit.addEventListener('click', () => fillFormForEdit(p));

      const btnDelete = document.createElement('button');
      btnDelete.className = 'small-btn';
      btnDelete.textContent = 'Excluir';
      btnDelete.addEventListener('click', () => deleteProduct(p));

      actions.appendChild(btnEdit);
      actions.appendChild(btnDelete);

      item.appendChild(thumb);
      item.appendChild(info);
      item.appendChild(actions);

      produtosList.appendChild(item);
    });
  }

  function fillFormForEdit(p){
    fields.id.value = p.id;
    fields.nome.value = p.nome;
    fields.descricao.value = p.descricao;
    fields.preco_tipo.value = p.preco_tipo || 'valor';
    fields.preco.value = p.preco ? p.preco : '';
    fields.frete_tipo.value = p.frete_tipo || 'gratis';
    fields.frete_valor.value = p.frete_valor ? p.frete_valor : '';
    fields.status.value = p.status || 'estoque';
    window.scrollTo({ top:0, behavior:'smooth' });
  }

  // excluir produto (apaga da tabela e tenta apagar o objeto do storage)
  async function deleteProduct(p){
    if(!confirm(`Excluir "${p.nome}" ?`)) return;
    try {
      // Deleta linha
      const { error: delErr } = await supabase.from('produtos').delete().eq('id', p.id);
      if(delErr) throw delErr;

      // tenta extrair path do URL e remover do storage (opcional)
      if(p.imagem_url){
        try {
          // supabase public url padrão: https://<project>.supabase.co/storage/v1/object/public/produtos/<path>
          const url = new URL(p.imagem_url);
          const parts = url.pathname.split('/');
          const idx = parts.findIndex(s => s === 'produtos');
          if(idx >= 0 && parts.length > idx+1){
            const filePath = parts.slice(idx+1).join('/');
            const { error: rmErr } = await supabase.storage.from('produtos').remove([filePath]);
            if(rmErr) console.warn('Não foi possível remover arquivo do storage', rmErr);
          }
        } catch(e){ console.warn('Erro ao tentar remover arquivo do storage:', e); }
      }

      loadProducts();
    } catch(err){
      alert('Erro ao excluir: ' + (err.message || err));
      console.error(err);
    }
  }

  // inicializa
  checkSession();

  // opcional: reagir a mudança de auth (quando loga em outra aba)
  supabase.auth.onAuthStateChange((event, session) => {
    if(session?.user) showPanel(session.user.email);
    else showLogin();
  });

})();
