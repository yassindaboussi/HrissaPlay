// Stations Data
const stations = [
  { name: "Mosaique FM", url: "http://radio.mosaiquefm.net:8000/mosalive", logo: "./images/mosaique.png" },
  { name: "Express FM", url: "https://expressfm.ice.infomaniak.ch/expressfm-64.mp3", logo: "./images/express.webp" },
  { name: "Jawhara FM", url: "https://streaming2.toutech.net/jawharafm", logo: "./images/jawhara.webp" },
  { name: "Diwan FM", url: "https://streaming.diwanfm.net/stream", logo: "./images/diwan.webp" },
  { name: "Knooz FM", url: "http://streaming.knoozfm.net:8000/knoozfm", logo: "./images/knooz.png" },
  { name: "Zitouna FM", url: "https://radio.radiotunisienne.tn/radiozaitouna", logo: "./images/zitouna.webp" },
  { name: "Radio Nationale", url: "https://radio.radiotunisienne.tn/nationale", logo: "./images/nationale.png" },
  { name: "Sabra FM", url: "https://manager5.streamradio.fr:1905/stream", logo: "./images/sabra.png" },
  { name: "Quran FM", url: "https://live.radioquran.tn/live", logo: "./images/quran.jpg" },
  { name: "RTCI", url: "http://rtstream.tanitweb.com/rtci", logo: "./images/rtci.png" },
  { name: "RadioMed FM", url: "http://stream6.tanitweb.com/radiomed", logo: "./images/med.jpg" },
  { name: "Oxygene FM", url: "https://streaming.radiooxygene.tn/oxygenefm", logo: "./images/oxygene.png" },
  { name: "Babnet FM", url: "https://radio.babnet.net/?type=http", logo: "./images/babnet.jpg" },
  { name: "Radio Tataouine", url: "https://radio.radiotunisienne.tn/tataouine", logo: "./images/tataouine.png" },
  { name: "Radio Sfax", url: "http://rtstream.tanitweb.com/sfax", logo: "./images/sfax.png" },
  { name: "Radio Jeunes FM", url: "http://rtstream.tanitweb.com/jeunes", logo: "./images/jeunes.png" },
  { name: "Radio Kef", url: "http://rtstream.tanitweb.com/kef", logo: "./images/kef.png" },
  { name: "Radio Gafsa", url: "http://rtstream.tanitweb.com/gafsa", logo: "./images/gafsa.png" },
  { name: "Karama FM", url: "https://hosting.studioradiomedia.fr:2685/stream", logo: "./images/karama.jpg" },
  { name: "Ulysse FM", url: "http://51.178.31.38:8000/stream", logo: "./images/ulysse.jpg" },
  { name: "Djerid FM", url: "https://n11.rcs.revma.com/wknqhm4yuchvv", logo: "./images/djerid.webp" },
  { name: "Misk FM", url: "https://live.misk.art/stream", logo: "./images/misk.jpg" },
  { name: "Dream FM", url: "https://c23.radioboss.fm/stream/109", logo: "./images/dream.png" },
  { name: "Radio culturelle", url: "http://rtstream.tanitweb.com/culturelle", logo: "./images/culturelle.png" },
  { name: "Radio Nabeul", url: "http://listen.radionomy.com/radionabeul", logo: "./images/nabeul.png" },
  { name: "Oasis FM", url: "https://stream2.rcast.net/69919", logo: "./images/oasis.png" },
  { name: "Radio monastir", url: "http://rtstream.tanitweb.com/monastir", logo: "./images/monastir.png" },
  { name: "Cap FM", url: "https://listen.radioking.com/radio/710810/stream/776366", logo: "./images/cap.png" },
  { name: "Radio Orient", url: "https://stream.rcs.revma.com/7hnrkawf4p8uv.mp3?CAID=2025030419211810371905636", logo: "./images/orient.png" }
];

// Logo preloader to ensure images load properly
function preloadLogos() {
  stations.forEach(station => {
    if (station.logo) {
      const img = new Image();
      img.src = station.logo;
    }
  });
}

// Improved logo display with white background support
function createLogoHTML(station) {
  if (station.logo) {
    const initials = station.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    
    return `
      <div class="logo-container">
        <img src="${station.logo}" alt="${station.name}" 
             onload="this.style.opacity='1'"
             onerror="
               this.style.display='none';
               const placeholder = this.parentElement.querySelector('.logo-placeholder');
               if (placeholder) placeholder.style.display='flex';
             "
             style="opacity:0; transition: opacity 0.3s; background: white;">
        <div class="logo-placeholder">
          <span class="placeholder">${initials || '🎙️'}</span>
        </div>
      </div>`;
  } else {
    const initials = station.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    return `
      <div class="logo-container">
        <div class="logo-placeholder" style="display:flex;">
          <span class="placeholder">${initials || '🎙️'}</span>
        </div>
      </div>`;
  }
}

// Load stations into the grid
function loadStations() {
  const stationsDiv = document.getElementById('stations');
  
  // Preload logos first
  preloadLogos();
  
  stations.forEach(st => {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      ${createLogoHTML(st)}
      <h3>${st.name}</h3>
      <div class="live-badge">
        مباشر
      </div>
    `;

    card.onclick = () => {
      if (window.playStation) {
        window.playStation(st);
      }
    };

    stationsDiv.appendChild(card);
  });
}

// Initialize stations when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadStations);
} else {
  loadStations();
}

// Export stations data
window.stationsData = stations;