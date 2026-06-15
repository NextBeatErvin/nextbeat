const sb = getSupabaseClient();
const rows = document.getElementById("guestRows");
const modeBox = document.getElementById("modeBox");
let currentGuests = [];

modeBox.innerHTML = sb ? "✅ Online admin lista aktív." : "⚠️ Helyi próba mód: csak ezen a böngészőn tárolt vendégeket mutat.";

function getLocalGuests(){return Object.values(JSON.parse(localStorage.getItem("nextbeat_guests") || "{}"))}

async function fetchGuests(){
  if(sb){
    const {data,error}=await sb.from("guests").select("*").order("created_at",{ascending:false});
    if(error) throw error;
    return data || [];
  }
  return getLocalGuests().sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
}

function renderGuests(guests){
  currentGuests=guests;
  rows.innerHTML="";
  document.getElementById("totalCount").textContent=guests.length;
  document.getElementById("usedCount").textContent=guests.filter(g=>g.status==="used").length;
  const today = new Date().toDateString();
  document.getElementById("todayCount").textContent=guests.filter(g=>g.created_at && new Date(g.created_at).toDateString()===today).length;

  for(const g of guests){
    const shortId = String(g.qr_code || "").slice(0, 18) + "...";
    const statusClass = g.status === "used" ? "status-used" : "status-registered";
    const statusText = g.status === "used" ? "Beolvasva" : "Érvényes";
    rows.innerHTML += `<tr>
      <td>${shortId}</td>
      <td>${g.full_name || ""}</td>
      <td>${g.phone || ""}</td>
      <td>${g.city || ""}</td>
      <td>${g.email || ""}</td>
      <td class="${statusClass}">${statusText}</td>
    </tr>`;
  }
}

async function loadGuests(){
  try{renderGuests(await fetchGuests())}
  catch(err){alert("Hiba: "+err.message)}
}

function exportCsv(){
  const header=["ID","Név","Telefonszám","Város","Email","Állapot","Regisztráció"];
  const lines=[header.join(";")];
  for(const g of currentGuests){
    lines.push([g.qr_code,g.full_name,g.phone,g.city,g.email,g.status,g.created_at].map(v=>`"${String(v||"").replaceAll('"','""')}"`).join(";"));
  }
  const blob=new Blob(["\ufeff"+lines.join("\n")],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download="nextbeat_vendeglista.csv";a.click();
  URL.revokeObjectURL(url);
}
document.getElementById("loadGuests").addEventListener("click",loadGuests);
document.getElementById("exportCsv").addEventListener("click",exportCsv);
loadGuests();
