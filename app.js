async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
const sb = getSupabaseClient();
const form = document.getElementById("registrationForm");
const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");
const ticketCard = document.getElementById("ticketCard");
const ticketPhoto = document.getElementById("ticketPhoto");
const ticketName = document.getElementById("ticketName");
const ticketMeta = document.getElementById("ticketMeta");
const qrHolder = document.getElementById("qrcode");
const modeBox = document.getElementById("modeBox");
let photoData = "";

modeBox.innerHTML = sb
  ? "✅ Online próba mód aktív: központi adatbázissal működik."
  : "⚠️ Helyi próba mód: ugyanabban a böngészőben működik. Több telefonos teszthez Supabase kell.";

function getLocalGuests(){return JSON.parse(localStorage.getItem("nextbeat_guests") || "{}")}
function saveLocalGuest(guest){const guests=getLocalGuests();guests[guest.qr_code]=guest;localStorage.setItem("nextbeat_guests",JSON.stringify(guests))}

photoInput.addEventListener("change",()=>{
  const file=photoInput.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=(e)=>{photoData=e.target.result;photoPreview.src=photoData;photoPreview.style.display="block"};
  reader.readAsDataURL(file);
});

async function uploadPhoto(qrCode, photoBase64){
  if(!sb || !photoBase64) return photoBase64;
  const response=await fetch(photoBase64);
  const blob=await response.blob();
  const filePath=`${qrCode}.jpg`;
  const {error}=await sb.storage.from("guest-photos").upload(filePath, blob, {contentType:"image/jpeg", upsert:true});
  if(error){console.warn(error.message); return photoBase64;}
  const {data}=sb.storage.from("guest-photos").getPublicUrl(filePath);
  return data.publicUrl;
}

form.addEventListener("submit", async (event)=>{
  event.preventDefault();
  const qrCode="NB-"+crypto.randomUUID();
  const guest={
    qr_code: qrCode,
    event_name: NEXTBEAT_CONFIG.eventName,
    full_name: document.getElementById("fullName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    city: document.getElementById("city").value.trim(),
    photo_url: photoData,
    password_hash: await hashPassword(document.getElementById("password").value),
    status: "registered",
    used_at: null
  };

  try{
    if(sb){
      guest.photo_url = await uploadPhoto(qrCode, photoData);
      const {error}=await sb.from("guests").insert([guest]);
      if(error) throw error;
    } else {
      guest.created_at = new Date().toISOString();
      saveLocalGuest(guest);
    }

    ticketPhoto.src=guest.photo_url;
    ticketName.textContent=guest.full_name;
    ticketMeta.textContent=`Azonosító: ${guest.qr_code}`;
    ticketCard.classList.remove("hidden");
    qrHolder.innerHTML="";
    new QRCode(qrHolder,{text:guest.qr_code,width:230,height:230,correctLevel:QRCode.CorrectLevel.H});
    ticketCard.scrollIntoView({behavior:"smooth",block:"center"});
  }catch(err){alert("Hiba történt: "+err.message)}
});

document.getElementById("printTicket").addEventListener("click",()=>window.print());
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const passwordHash = await hashPassword(password);

    const { data, error } = await sb
      .from("guests")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      alert("Nincs ilyen regisztráció.");
      return;
    }

    if (data.password_hash !== passwordHash) {
      alert("Hibás jelszó.");
      return;
    }

    ticketPhoto.src = data.photo_url || "";
    ticketName.textContent = data.full_name;
    ticketMeta.textContent = `Azonosító: ${data.qr_code}`;

    ticketCard.classList.remove("hidden");

    qrHolder.innerHTML = "";

    new QRCode(qrHolder, {
      text: data.qr_code,
      width: 230,
      height: 230,
      correctLevel: QRCode.CorrectLevel.H
    });

    ticketCard.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  });
}