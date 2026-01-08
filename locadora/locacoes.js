const sb = supabase.createClient(
  "https://pdajixsoowcyhnjwhgpc.supabase.co",
  "sb_publishable_LatlFlcxk6IchHe3RNmfwA_9Oq4EsZw"
);

/* ================= CARREGAR LOCAÇÕES ================= */
async function carregar(){
  const { data:locacoes, error } = await sb
    .from("locacoes")
    .select("*")
    .order("created_at",{ ascending:false });

  if(error){
    console.error(error);
    return;
  }

  const { data:veiculos } = await sb
    .from("veiculos")
    .select("id, modelo");

  const mapa = {};
  veiculos.forEach(v => mapa[v.id] = v.modelo);

  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  locacoes.forEach(l => {
    lista.innerHTML += `
      <div class="card">
        <h3>🚗 ${mapa[l.veiculo_id] || "Veículo"}</h3>

        <p><b>Cliente:</b> ${l.nome}</p>
        <p><b>Telefone:</b> ${l.telefone}</p>
        <p><b>Dias:</b> ${l.dias}</p>
        <p><b>Total:</b> R$ ${l.total}</p>

        <span class="badge ${l.status}">
          ${l.status.toUpperCase()}
        </span>

        <div class="actions">
          <button class="btn pdf" onclick="verDocumentos('${l.id}')">
            📂 Ver documentos
          </button>

          ${
            l.status === "solicitada"
              ? `
                <button class="btn aprovar" onclick="aprovar('${l.id}')">Aprovar</button>
                <button class="btn recusar" onclick="recusar('${l.id}')">Recusar</button>
              `
              : ""
          }

          <button class="btn excluir" onclick="excluir('${l.id}')">Excluir</button>
        </div>
      </div>
    `;
  });
}

/* ================= VER DOCUMENTOS ================= */
async function verDocumentos(id){
  const { data:l, error } = await sb
    .from("locacoes")
    .select("*")
    .eq("id", id)
    .single();

  if(error){
    alert("Erro ao carregar documentos");
    return;
  }

  const w = window.open("", "_blank");

  w.document.write(`
    <html>
    <head>
      <title>Documentos do Cliente</title>
      <style>
        body{font-family:Arial;padding:20px}
        img{max-width:100%;margin-bottom:20px;border:1px solid #ccc}
        h3{margin-top:30px}
      </style>
    </head>
    <body>

      <h2>📄 Documentos do Cliente</h2>

      ${l.selfie_url ? `<h3>Selfie</h3><img src="${l.selfie_url}">` : "<p>❌ Selfie não enviada</p>"}
      ${l.rg_frente_url ? `<h3>RG Frente</h3><img src="${l.rg_frente_url}">` : "<p>❌ RG frente não enviado</p>"}
      ${l.rg_verso_url ? `<h3>RG Verso</h3><img src="${l.rg_verso_url}">` : "<p>❌ RG verso não enviado</p>"}
      ${l.cpf_url ? `<h3>CPF</h3><img src="${l.cpf_url}">` : "<p>❌ CPF não enviado</p>"}
      ${l.cnh_url ? `<h3>CNH</h3><img src="${l.cnh_url}">` : "<p>❌ CNH não enviada</p>"}
      ${l.assinatura_url ? `<h3>Assinatura</h3><img src="${l.assinatura_url}">` : "<p>❌ Assinatura não enviada</p>"}

    </body>
    </html>
  `);
}

/* ================= APROVAR + PDF PROFISSIONAL ================= */
async function aprovar(id){
  const { jsPDF } = window.jspdf;

  const { data:l } = await sb
    .from("locacoes")
    .select("*")
    .eq("id", id)
    .single();

  const { data:v } = await sb
    .from("veiculos")
    .select("modelo")
    .eq("id", l.veiculo_id)
    .single();

  const { data:cfg } = await sb
    .from("config_site")
    .select("nome_site, whatsapp, logo_url")
    .eq("app_id", l.app_id)
    .single();

  const nomeLocadora = cfg?.nome_site || "Locadora";
  const telefoneLocadora = cfg?.whatsapp
    ? cfg.whatsapp.replace(/^55/, "")
    : "";

  const pdf = new jsPDF();

  /* ===== LOGO ===== */
  if(cfg?.logo_url){
    const blob = await fetch(cfg.logo_url).then(r => r.blob());
    const fr = new FileReader();
    fr.readAsDataURL(blob);
    await new Promise(res => fr.onload = res);
    pdf.addImage(fr.result, "PNG", 10, 10, 45, 18);
  }

  /* ===== CABEÇALHO ===== */
  pdf.setFontSize(16);
  pdf.text(nomeLocadora, 60, 15);

  pdf.setFontSize(10);
  if(telefoneLocadora){
    pdf.text("Tel: " + telefoneLocadora, 60, 22);
  }

  pdf.setLineWidth(0.5);
  pdf.line(10, 28, 200, 28);

  /* ===== CORPO ===== */
  let y = 40;

  pdf.setFontSize(12);
  pdf.text("CONTRATO DE LOCAÇÃO DE VEÍCULO", 10, y);
  y += 10;

  pdf.setFontSize(10);
  pdf.text(`Cliente: ${l.nome}`, 10, y); y += 6;
  pdf.text(`Telefone: ${l.telefone}`, 10, y); y += 6;
  pdf.text(`Veículo: ${v?.modelo}`, 10, y); y += 6;
  pdf.text(`Dias de locação: ${l.dias}`, 10, y); y += 6;
  pdf.text(`Valor total: R$ ${l.total}`, 10, y); y += 10;

  pdf.setFontSize(9);
  pdf.text(
`CLÁUSULAS CONTRATUAIS:

1. O veículo deverá ser devolvido na data acordada.
2. Multas, danos ou infrações são de responsabilidade do locatário.
3. É proibido sublocar ou emprestar o veículo.
4. Este contrato possui validade legal mediante aceite digital.`,
    10,
    y,
    { maxWidth: 190 }
  );

  y += 40;
  pdf.setFontSize(10);
  pdf.text("Assinatura do Cliente:", 10, y);

  if(l.assinatura_url){
    const blob = await fetch(l.assinatura_url).then(r => r.blob());
    const fr = new FileReader();
    fr.readAsDataURL(blob);
    await new Promise(res => fr.onload = res);
    pdf.addImage(fr.result, "PNG", 10, y + 4, 60, 20);
  }

  /* ===== FINAL ===== */
  const url = URL.createObjectURL(pdf.output("blob"));

  await sb
    .from("locacoes")
    .update({ status: "ativa" })
    .eq("id", id);

  const msg = `✅ *SOLICITAÇÃO APROVADA*

Seu contrato está pronto:
${url}

⚠️ Apresente este contrato na retirada do veículo.`;

  window.open(
    "https://wa.me/55" + l.telefone.replace(/\D/g, "") +
    "?text=" + encodeURIComponent(msg),
    "_blank"
  );

  carregar();
}

/* ================= OUTROS ================= */
async function recusar(id){
  await sb.from("locacoes").update({ status:"recusada" }).eq("id", id);
  carregar();
}

async function excluir(id){
  if(confirm("Excluir locação?")){
    await sb.from("locacoes").delete().eq("id", id);
    carregar();
  }
}

/* START */
carregar();
