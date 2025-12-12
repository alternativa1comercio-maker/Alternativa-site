// vitrine.js
(async () => {
  const SUPABASE_URL = window.__SUPABASE_CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.__SUPABASE_CONFIG.SUPABASE_ANON_KEY;
 const supabase = window.supabase.createClient(URL, KEY);


  const grid = document.getElementById('productsGrid');

  async function load() {
    grid.innerHTML = 'Carregando...';
    const { data, error } = await supabase.from('produtos').select('*').order('criado_em', { ascending: false }).limit(50);
    if(error){ grid.innerHTML = '<p>Erro ao carregar produtos.</p>'; console.error(error); return; }
    if(!data || data.length === 0){ grid.innerHTML = '<p>Nenhum produto cadastrado.</p>'; return; }

    grid.innerHTML = '';
    data.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.style = "background:linear-gradient(180deg, #121212, rgba(18,18,18,0.85));padding:12px;border-radius:12px;border:1px solid rgba(227,30,36,0.08);display:flex;flex-direction:column;gap:8px;";

      const img = document.createElement('img');
      img.src = p.imagem_url || '';
      img.alt = p.nome;
      img.style = "width:100%;height:160px;object-fit:cover;border-radius:8px;";

      const title = document.createElement('h4');
      title.textContent = p.nome;
      title.style = 'margin:0;color:#fff';

      const desc = document.createElement('p');
      desc.textContent = p.descricao.length > 120 ? p.descricao.slice(0,120)+'...' : p.descricao;
      desc.style = 'color:#cfcfcf;font-size:0.95rem;margin:0';

      const meta = document.createElement('div');
      meta.innerHTML = `<small style="color:#9b9b9b">${p.preco_tipo === 'valor' ? 'R$ '+(p.preco?Number(p.preco).toFixed(2):'-') : 'Preço a combinar'}</small>`;

      const btn = document.createElement('a');
      const mensagem = encodeURIComponent(`Olá! Vi esta peça no site da Alternativa e gostaria de saber o valor e se ainda está disponível:%0A• Produto: ${p.nome}%0APode me ajudar?`);
      btn.href = `https://wa.me/5534998101100?text=${mensagem}`;
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      btn.textContent = 'Verificar Disponibilidade';
      btn.style = 'display:inline-block;padding:10px;border-radius:10px;text-align:center;text-decoration:none;font-weight:700;background:linear-gradient(90deg,#2ecc71,#27ae60);color:#fff;margin-top:6px';

      card.appendChild(img);
      card.appendChild(title);
      card.appendChild(desc);
      card.appendChild(meta);
      card.appendChild(btn);

      grid.appendChild(card);
    });
  }

  load();
})();
