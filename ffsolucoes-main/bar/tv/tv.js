const supabase = window.supabase.createClient(
  "https://SUA_URL.supabase.co",
  "SUA_ANON_KEY"
);

const params = new URLSearchParams(window.location.search);
const app_id = params.get("app_id");

if(!app_id){
  document.body.innerHTML = "<h1 style='color:red'>APP_ID não informado</h1>";
  throw new Error("app_id ausente");
}

async function carregarEstabelecimento(){
  const { data, error } = await supabase
    .from("estabelecimentos")
    .select("*")
    .eq("id", app_id)
    .single();

  if(error){
    console.error(error);
    return;
  }

  document.getElementById("logo").src = data.logo_url;
  document.getElementById("nome").innerText = data.nome;
  document.getElementById("slogan").innerText = data.slogan || "";
  document.getElementById("status").innerText = data.status;

  if(data.cor_primaria){
    document.documentElement
      .style
      .setProperty("--primary", data.cor_primaria);
  }
}

carregarEstabelecimento();
setInterval(carregarEstabelecimento, 10000);
