/*
Başlangıçta kullanıcının konuma erişmeliyiz.Bu sayede haritanın başlangıç konumunu belirleyeceğiz.



*/

import { personIcon } from "./constants.js";
import { getNoteIcon, getStatus } from "./helpers.js";
import elements from "./ui.js";

// global değişkenler
var map;
let clickedCoords;
let layer;
// Localstorage'dan notes keyine sahip elemanları al
let notes = JSON.parse(localStorage.getItem("notes")) || [];

// window içerisindeki navigator objesi içerisinde kullanıcının açmış olduğu sekme ile alakalı birçok veriyi bulundurur.(kordinat,tarayıcı ile alakalı veriler,pc ile alakalı veriler)Bizde bu yapı içerisindeki geolocation yapısıyla kordinat verisine eriştik.geolocation içerisindeki  getCurrentPosition kullanıcının  mevcut konumunu almak için kullanılır.Bu fonksiyon içerisine iki adet callBack fonksiyon ister.Birincisi kullanıcının konum bilgisini paylaşması durumunda çalışır ikincisi ise konum bilgisini paylaşmaması durumunda çalışır.
window.navigator.geolocation.getCurrentPosition(
    (e)=>{
          // Konum bilgisi paylaşıldığında
        loadMap([e.coords.latitude, e.coords.longitude], "Mevcut Konum");
    },
    (e)=>{
         // Konum bilgisi paylaşılmadığında
        loadMap([39.925143, 32.837528], "Varsayılan Konum");
    }
);





// ! Haritayı oluşturan fonksiyon
function loadMap(currentPosition, msg) {
    map = L.map("map", {
        zoomControl: false,
    }).setView(currentPosition, 12);

    //haritayı render eder
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

// zoom araçlarının konumunu belirle
L.control.zoom({
    position: "bottomright",
})
.addTo(map);

    // ekrana basılacak bir katman oluştur

    layer = L.layerGroup().addTo(map);

     // Kullanıcın başlangıç konumuna bir tane marker ekle
    L.marker(currentPosition, { icon: personIcon }).addTo(map).bindPopup(msg);

// harita üzerindeki tıklama olayını izle

map.on("click", onMapClick);


// notları render eden fonksiyon
renderNotes();

// markerleri render eden fonskiyon
renderMarkers();
}

// harita tıklanıldıgında çalışacak fonksiyon
function onMapClick(e) {
    // tıklanan yerin koordinatına eriş
    clickedCoords = [e.latlng.lat, e.latlng.lng];

    // aside a add clasını ekle
    elements.aside.classList.add("add");
}

// form gönderildiğinde çalışacak fonskiyon

elements.form.addEventListener("submit", (e) => {
    e.preventDefault();
   
    // form içerisindeki değerlere eriş
    const title = e.target[0].value;
    const date = e.target[1].value;
    const status = e.target[2].value;

    // bir tane not objesi oluştur

    const newNote = {
        id: new Date().getTime(),
        title,
        date,
        status,
        coords: clickedCoords,
    };

     // Note dizisine yeni notu ekle
    notes.push(newNote);

  // LocalStorage'a notları kaydet
   localStorage.setItem("notes", JSON.stringify(newNote));

   // formu resetle
   e.target.reset();

   // aside i eski haline çevir
   elements.aside.classList.remove("add");

   //noteları render et
   renderNotes();

   // markerleri render eden fonksiyon
   renderMarkers();

});

// closebtn e tıklanınca aside i tekrardan eski haline çevir

elements.cancelBtn.addEventListener("click", () => {
    elements.aside.classList.remove("add");
});

// mevcut notları render eden fonksiyon

function renderNotes() {
    //note dizisini dönerek herbir not için bir html oluştur
    const noteCard = notes
    .map((note) => {
         // Tarih ayarlaması
         const date = new Date(note.date).toLocaleDateString("tr", {
            day: "numeric",
            month: "long",
            year: "numeric"
         });

         // Status ayarlaması
      //  getStatus adında bir fonksiyon yazıldı.Bu fonksiyon kendisine verilen status değerine göre uygun ifadeyi return etti

      return  `<li>
                <div>
                    <p>${note.title}</p>
                    <p>${date}</p>
                    <p>${getStatus(note.status)}</p>
                </div>

                <div class="icons">
                    <i data-id="${
              note.id
            }" class="bi bi-airplane-fill" id="fly-btn"></i>
            <i data-id="${note.id}" class="bi bi-trash" id="delete-btn"></i>
                </div>
            </li>`;
    })
.join("");
    // İlgili html'i arayüze ekle
    elements.noteList.innerHTML = noteCard;

    // delete ıconlara eriş
    document.querySelectorAll("#delete-btn").forEach((btn) => {
        // delete iconun data ıd sini eriş
        const id = btn.dataset.id;
        // Delete Iconlarına tıklanınca deleteNote fonksiyonunu çalıştır
        btn.addEventListener("click", () => {
            deleteNote(id);
        });
    });

    // fly ıconlara eriş
    document.querySelectorAll("#fly-btn").forEach((btn) => {
// fly btn'e tıklanınca flyNote fonskiyonu çalıştır

btn.addEventListener("click", () => {
    // fly-btn in ıd sine eriş
    const id = +btn.dataset.id;
    flyToNote(id);
});
    });
}

// her not için bir marker render eden fonskiyon

function renderMarkers() {
    // Haritadaki markerları sıfırla
    layer.clearLayers();
    notes.map((note) => {

        // eklenecek ıconun türünü belirle
        const icon = getNoteIcon(note.status);
        // not için bir marker oluştur
        L.marker(note.coords, { icon }).addTo(layer).bindPopup(notes.title);
    });
}


// not silen fonksiyon

function deleteNote(id){
    // kullanıcıdan onay al

const res = confirm("Not silme işlemini onaylıyor musunuz ?");

// eger kullanıcı onayladıysa
if (res) {
    // ıd si bilinen notu note dizisinden kaldır
notes = notes.filter((note) => note.id != id);
    // localstorage ı güncelle
    localStorage.setItem("notes", JSON.stringify(notes));

    // notları render et
renderNotes();

    // markerleri render et
    renderMarkers();
}

}

// notlara focuslanan fonksiyon
function flyToNote(id) {
    // ıd si bilinen notu note dizisi içerinden bul
    const foundedNote = notes.find((note) => note.id == id);

    // bulunan not'a focuslan
    map.flyTo(foundedNote.coords, 12);
}

// arrowıcona tıklaınca çalışacak fonmksiyon

elements.arrowIcon.addEventListener("click", () => {
    elements.aside.classList.toggle("hide");
});