document.addEventListener("DOMContentLoaded", () => {
  iniciarSite();
});

const supabaseClient = window.supabase.createClient(
  "https://pdajixsoowcyhnjwhgpc.supabase.co",
  "sb_publishable_LatlFlcxk6IchHe3RNmfwA_9Oq4EsZw"
);

const params = new URLSearchParams(window.location.search);
const appId = params.get("app");

const nomeEl = document.getElementById("nome");
const logoEl = document.getElementById("logo");
const conteudo = document.getElementById("conteudo");

async function iniciarSite() {
  if (!appId) {
    nomeEl.innerText = "Site indisponível";
    return;
  }

  const { data, error } = await supabaseClient
    .from("config_site")
    .select("nome_site, logo_url")
    .eq("app_id", appId)
    .maybeSingle();

  console.log("CONFIG_SITE:", data);

  if (error || !data) {
    nomeEl.innerText = "Site indisponível";
    return;
  }

  nomeEl.innerText = data.nome_site;

  if (data.logo_url) {
    logoEl.src = data.logo_url;
    logoEl.style.display = "block";
  }
}
