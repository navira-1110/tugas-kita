const KUNCI = "tugas-kita-data";
let tugas = [];
let tabAktif = "aktif";

const $ = (id) => document.getElementById(id);

function muat() {
  try {
    tugas = JSON.parse(localStorage.getItem(KUNCI)) || [];
  } catch (e) {
    tugas = [];
  }
}

function simpan() {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(tugas));
  } catch (e) {
    alert("Data tidak bisa disimpan di browser ini.");
  }
}

function hitungSisa(deadline) {
  const selisih = new Date(deadline).getTime() - Date.now();
  const abs = Math.abs(selisih);
  const menit = Math.floor(abs / 60000);
  const jam = Math.floor(abs / 3600000);
  const hari = Math.floor(abs / 86400000);

  let teks;
  if (hari >= 1) teks = hari + " hari";
  else if (jam >= 1) teks = jam + " jam";
  else teks = Math.max(menit, 1) + " menit";

  let kelas = "hijau";
  if (selisih < 0) kelas = "lewat";
  else if (selisih < 86400000) kelas = "merah";
  else if (selisih < 3 * 86400000) kelas = "kuning";

  return { teks, kelas, lewat: selisih < 0 };
}

function formatTanggal(d) {
  return new Date(d).toLocaleString("id-ID", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit"
  });
}

function perbaruiMatkul() {
  const daftar = [...new Set(tugas.map((t) => t.matkul))].sort();
  const filter = $("filter");
  const dipilih = filter.value;
  filter.innerHTML = '<option value="">Semua matkul</option>';
  $("daftar-matkul").innerHTML = "";
  daftar.forEach((m) => {
    const o = document.createElement("option");
    o.value = m; o.textContent = m;
    filter.appendChild(o);
    const d = document.createElement("option");
    d.value = m;
    $("daftar-matkul").appendChild(d);
  });
  filter.value = daftar.includes(dipilih) ? dipilih : "";
}

function render() {
  const filter = $("filter").value;
  const belum = tugas.filter((t) => !t.selesai);
  const mendesak = belum.filter((t) => {
    const s = new Date(t.deadline) - Date.now();
    return s >= 0 && s < 86400000;
  }).length;

  $("ringkasan").textContent = belum.length === 0
    ? "Tidak ada tugas yang menunggu."
    : belum.length + " tugas belum selesai" + (mendesak ? ", " + mendesak + " harus selesai dalam 24 jam." : ".");

  let tampil = tugas.filter((t) => (tabAktif === "aktif" ? !t.selesai : t.selesai));
  if (filter) tampil = tampil.filter((t) => t.matkul === filter);
  tampil.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  const ul = $("daftar");
  ul.innerHTML = "";

  if (tampil.length === 0) {
    const li = document.createElement("li");
    li.style.display = "block";
    li.style.borderLeftWidth = "1px";
    li.className = "kosong";
    li.textContent = tabAktif === "aktif"
      ? "Belum ada tugas. Isi form di atas untuk menambah."
      : "Belum ada tugas yang selesai.";
    ul.appendChild(li);
    return;
  }

  tampil.forEach((t) => {
    const sisa = hitungSisa(t.deadline);
    const li = document.createElement("li");
    li.className = t.selesai ? "selesai" : sisa.kelas;

    const cek = document.createElement("input");
    cek.type = "checkbox";
    cek.checked = t.selesai;
    cek.setAttribute("aria-label", "Tandai selesai: " + t.nama);
    cek.addEventListener("change", () => {
      t.selesai = cek.checked;
      simpan(); render();
    });

    const info = document.createElement("div");
    const judul = document.createElement("div");
    judul.className = "judul"; judul.textContent = t.nama;
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = t.matkul + " • " + formatTanggal(t.deadline);
    info.append(judul, meta);
    if (t.catatan) {
      const c = document.createElement("div");
      c.className = "meta"; c.textContent = t.catatan;
      info.appendChild(c);
    }

    const kanan = document.createElement("div");
    kanan.className = "sisa";
    if (!t.selesai) {
      kanan.textContent = sisa.teks;
      const k = document.createElement("small");
      k.textContent = sisa.lewat ? "terlewat" : "lagi";
      kanan.appendChild(k);
    }

    const hapus = document.createElement("button");
    hapus.className = "hapus";
    hapus.textContent = "Hapus";
    hapus.addEventListener("click", () => {
      if (confirm('Hapus tugas "' + t.nama + '"?')) {
        tugas = tugas.filter((x) => x.id !== t.id);
        simpan(); perbaruiMatkul(); render();
      }
    });

    li.append(cek, info, kanan, hapus);
    ul.appendChild(li);
  });
}

$("form-tugas").addEventListener("submit", (e) => {
  e.preventDefault();
  tugas.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    nama: $("nama").value.trim(),
    matkul: $("matkul").value.trim(),
    deadline: $("deadline").value,
    catatan: $("catatan").value.trim(),
    selesai: false
  });
  simpan();
  e.target.reset();
  perbaruiMatkul();
  tabAktif = "aktif";
  gantiTab();
  render();
});

function gantiTab() {
  $("tab-aktif").classList.toggle("aktif", tabAktif === "aktif");
  $("tab-selesai").classList.toggle("aktif", tabAktif === "selesai");
  $("tab-aktif").setAttribute("aria-selected", tabAktif === "aktif");
  $("tab-selesai").setAttribute("aria-selected", tabAktif === "selesai");
}
$("tab-aktif").addEventListener("click", () => { tabAktif = "aktif"; gantiTab(); render(); });
$("tab-selesai").addEventListener("click", () => { tabAktif = "selesai"; gantiTab(); render(); });
$("filter").addEventListener("change", render);

$("ekspor").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(tugas, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "tugas-kita-cadangan.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

$("impor").addEventListener("click", () => $("berkas").click());
$("berkas").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data)) throw new Error();
      tugas = data.filter((t) => t && t.nama && t.deadline).map((t) => ({
        id: String(t.id || Date.now() + Math.random()),
        nama: String(t.nama),
        matkul: String(t.matkul || "Umum"),
        deadline: String(t.deadline),
        catatan: String(t.catatan || ""),
        selesai: Boolean(t.selesai)
      }));
      simpan(); perbaruiMatkul(); render();
    } catch (err) {
      alert("File cadangan tidak valid.");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

muat();
perbaruiMatkul();
render();
setInterval(render, 60000);
