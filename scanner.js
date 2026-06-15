const sb = getSupabaseClient();
const resultBox = document.getElementById("scanResult");
const resetBtn = document.getElementById("resetScan");
const modeBox = document.getElementById("modeBox");
let scanner;

modeBox.innerHTML = sb ? "✅ Online ellenőrzés aktív." : "⚠️ Helyi próba mód: csak az ezen a böngészőn regisztrált vendégeket látja.";

function getLocalGuests(){return JSON.parse(localStorage.getItem("nextbeat_guests") || "{}")}
function saveLocalGuests(guests){localStorage.setItem("nextbeat_guests",JSON.stringify(guests))}
function showResult(type,html){resultBox.className="scan-result "+type;resultBox.innerHTML=html}

async function checkGuest(qrCode){
  if(sb){
    const {data,error}=await sb.from("guests").select("*").eq("event_qr_code", qrCode).single();
    if(error || !data) return {found:false};
    if(data.status==="used") return {found:true,used:true,guest:data};
    const {error:updateError}=await sb.from("guests").update({status:"used",used_at:new Date().toISOString()}).eq("qr_code",qrCode);
    if(updateError) throw updateError;
    return {found:true,used:false,guest:data};
  }
  const guests=getLocalGuests();
  const guest=guests[qrCode];
  if(!guest) return {found:false};
  if(guest.status==="used") return {found:true,used:true,guest};
  guest.status="used"; guest.used_at=new Date().toISOString(); guests[qrCode]=guest; saveLocalGuests(guests);
  return {found:true,used:false,guest};
}

async function onScan(decodedText){
  try{
    const result=await checkGuest(decodedText);
    if(!result.found){
      showResult("error","❌ Nem található regisztráció ehhez a QR-kódhoz.");
    }else if(result.used){
      showResult("error",`⚠️ Ez a QR-kód már fel lett használva.<br><br><strong>Név:</strong> ${result.guest.full_name}<br><strong>Város:</strong> ${result.guest.city}<br><strong>Felhasználva:</strong> ${result.guest.used_at || "-"}`);
    }else{
      showResult("ok",`✅ Sikeres regisztráció / beléptetés<br><br><strong>Név:</strong> ${result.guest.full_name}<br><strong>Város:</strong> ${result.guest.city}<br><strong>Telefon:</strong> ${result.guest.phone}<br><strong>Email:</strong> ${result.guest.email}`);
    }
    scanner.clear();
  }catch(err){showResult("error","Hiba az ellenőrzésnél: "+err.message)}
}

function startScanner(){
  showResult("waiting","Várakozás QR-kódra...");
  scanner = new Html5QrcodeScanner("reader",{fps:10,qrbox:{width:260,height:260}});
  scanner.render(onScan);
}
resetBtn.addEventListener("click",()=>{document.getElementById("reader").innerHTML="";startScanner()});
startScanner();
