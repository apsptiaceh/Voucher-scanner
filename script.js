// Ganti dengan URL API dari Spreadsheet yang kita buat semalam
const API_URL = "https://script.google.com/macros/s/AKfycbzZNsHV8AzC1-58geWO_-VOjEqe0jdM-S5D_CjfUrg1tuhSTTevvhioSe8KxdELSU78/exec"; 
let isScanning = true;
let currentMode = "pakarmaru";

function beep(freq = 1000) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = freq;
  oscillator.connect(audioCtx.destination);
  oscillator.start();
  setTimeout(() => { oscillator.stop(); }, 150);
}

function setMode(mode) {
  currentMode = mode;
  document.getElementById("result").innerHTML = "";
  
  const btnPakarmaru = document.getElementById("btnPakarmaru");
  const btnUmum = document.getElementById("btnUmum");
  
  btnPakarmaru.classList.remove("active");
  btnUmum.classList.remove("active");
  
  if (mode === "pakarmaru") {
    btnPakarmaru.classList.add("active");
  } else {
    btnUmum.classList.add("active");
  }
}

function resetScanner() {
  document.getElementById("result").innerHTML = "";
  isScanning = true;
  html5QrcodeScanner.clear().then(() => {
    html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    html5QrcodeScanner.render(onScanSuccess);
  });
}

function konfirmasiVoucher(kode) {
  const btn = document.querySelector(".btn-confirm");
  btn.disabled = true;
  btn.innerHTML = "Menyimpan...";

  // Mengirim sinyal redeem ke backend
  fetch(API_URL + "?action=redeem&kode=" + encodeURIComponent(kode) + "&mode=" + encodeURIComponent(currentMode))
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        btn.innerHTML = "Redeem Berhasil!";
        btn.style.background = "#22c55e";
        setTimeout(() => { resetScanner(); }, 1500);
      } else {
        btn.disabled = false;
        btn.innerHTML = "Konfirmasi Redeem";
        alert("Gagal redeem: " + data.message);
      }
    })
    .catch(err => {
      console.error(err);
      alert("Gagal terhubung ke server");
      btn.disabled = false;
      btn.innerHTML = "Konfirmasi Redeem";
    });
}

function onScanSuccess(decodedText) {
  if (!isScanning) return;
  isScanning = false;
  
  // Mengirim sinyal cek kode ke backend
  fetch(API_URL + "?action=check&kode=" + encodeURIComponent(decodedText) + "&mode=" + encodeURIComponent(currentMode))
    .then(response => response.json())
    .then(data => {
      if (data.status === "success") beep(1200);
      else if (data.status === "used") beep(500);
      else beep(250);

      let statusClass = data.status === "success" ? "valid" : (data.status === "used" ? "used" : "notfound");
      let textClass = data.status === "success" ? "success" : (data.status === "used" ? "danger" : "warning");
      
      // Jika statusnya valid, munculkan tombol Redeem. Jika tidak, sembunyikan.
      let buttonHtml = data.status === "success" ? 
        `<button class="btn-confirm" onclick="konfirmasiVoucher('${data.kode}')">Konfirmasi Redeem</button>` : '';

      document.getElementById("result").innerHTML = `
        <div class="result-card ${statusClass}">
          <div class="status ${textClass}">${data.message}</div>
          <div class="info">
            <div class="info-row"><span class="label">Nama</span><span class="value">${data.nama || "-"}</span></div>
            <div class="info-row"><span class="label">Fakultas</span><span class="value">${data.fakultas || "-"}</span></div>
            <div class="info-row"><span class="label">Kode</span><span class="value">${data.kode || "-"}</span></div>
          </div>
          <div class="redeem-section">${buttonHtml}</div>
        </div>
      `;
    })
    .catch(err => {
      console.error(err);
      document.getElementById("result").innerHTML = "<h3>Gagal terhubung ke server</h3>";
      isScanning = true;
    });
}

// Inisialisasi Scanner
let html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
html5QrcodeScanner.render(onScanSuccess);

// Fitur Cari Manual
function cariVoucher() {
  const keyword = document.getElementById("searchVoucher").value;
  if (!keyword) return alert("Masukkan kata kunci");
  
  fetch(API_URL + "?action=search&keyword=" + encodeURIComponent(keyword))
    .then(r => r.json())
    .then(data => {
        // Logika render pencarian (Bisa disesuaikan dengan kebutuhan Pakarmaru)
    });
}