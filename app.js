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
const modeBox = document.getElementById("modeBox");

let photoData = "";

if (modeBox) {
  modeBox.innerHTML = sb
    ? "✅ Online rendszer aktív."
    : "❌ Supabase nincs beállítva. Ellenőrizd a config.js fájlt.";
}

if (photoInput) {
  photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      photoData = e.target.result;
      photoPreview.src = photoData;
      photoPreview.style.display = "block";
    };

    reader.readAsDataURL(file);
  });
}

async function uploadPhoto(email, photoBase64) {
  if (!photoBase64) return "";

  const response = await fetch(photoBase64);
  const blob = await response.blob();

  const filePath =
    email.replace(/[^a-zA-Z0-9]/g, "_") +
    "_" +
    Date.now() +
    ".jpg";

  const { error } = await sb.storage
    .from("guest-photos")
    .upload(filePath, blob, {
      contentType: "image/jpeg",
      upsert: true
    });

  if (error) {
    console.warn("Fotó feltöltési hiba:", error.message);
    return "";
  }

  const { data } = sb.storage
    .from("guest-photos")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!sb) {
      alert("Nincs Supabase kapcsolat. Ellenőrizd a config.js fájlt.");
      return;
    }

    try {
      const fullName = document.getElementById("fullName").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const city = document.getElementById("city").value.trim();

      if (password.length < 8) {
        alert("A jelszó legalább 8 karakter legyen.");
        return;
      }

      const { data: existingUser } = await sb
        .from("guests")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existingUser) {
        alert("Ehhez az email címhez már van fiók.");
        return;
      }

      const passwordHash = await hashPassword(password);
      const photoUrl = await uploadPhoto(email, photoData);

      const { error } = await sb
        .from("guests")
        .insert([
          {
            full_name: fullName,
            phone: phone,
            email: email,
            city: city,
            photo_url: photoUrl,
            password_hash: passwordHash,
            active_event: null,
            event_qr_code: null,
            event_qr_used: false,
            event_qr_used_at: null,
            role: "user"
          }
        ]);

      if (error) {
        throw error;
      }

      alert("Sikeres fiók létrehozás! Most már be tudsz jelentkezni.");

      form.reset();

      if (photoPreview) {
        photoPreview.src = "";
        photoPreview.style.display = "none";
      }

      window.location.href = "profile.html";

    } catch (err) {
      alert("Hiba történt a fiók létrehozásakor: " + err.message);
    }
  });
}