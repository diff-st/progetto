async function sendEmergency() {
  if (!confirm("Confermi l'invio dell'avviso di MALATTIA?")) return;

  try {
    const resp = await fetch("/api/emergency/", {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest"
      }
    });
    if (!resp.ok) {
      alert("Errore invio avviso");
      return;
    }
    alert("Avviso inviato con successo");
  } catch (err) {
    console.error(err);
    alert("Errore di rete nell'invio dell'emergenza");
  }
}

async function refreshData() {
  try {
    const resp = await fetch("/api/latest/");
    if (!resp.ok) return;

    const data = await resp.json();
    const nodes = data.nodes || [];
    const tbody = document.getElementById("nodes-tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!nodes.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.textContent = "Nessun dato disponibile.";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    nodes.forEach((m) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.node_id}</td>
        <td>${m.temp_aria ?? ""}</td>
        <td>${m.umid_aria ?? ""}</td>
        <td>${m.umid_suolo ?? ""}</td>
        <td>${m.rain_mm ?? ""}</td>
        <td>${m.time || ""}</td>
      `;
      tbody.appendChild(tr);
    });
    // update charts with latest nodes values
    try {
      const labels = nodes.map(n => n.node_id);
      const temps = nodes.map(n => n.temp_aria ?? 0);
      const umidA = nodes.map(n => n.umid_aria ?? 0);
      const umidS = nodes.map(n => n.umid_suolo ?? 0);
      const rain = nodes.map(n => n.rain_mm ?? 0);

      updateChart('chart-temp', labels, temps, 'Temperatura (°C)');
      updateChart('chart-umid-aria', labels, umidA, 'Umidità aria (%)');
      updateChart('chart-umid-suolo', labels, umidS, 'Umidità suolo (%)');
      updateChart('chart-rain', labels, rain, 'Pioggia (mm)');
    } catch (err) {
      console.error('Errore aggiornamento grafici', err);
    }
  } catch (err) {
    console.error("Errore refresh dati", err);
  }
}

// Charts handling
const CHARTS = {};
function updateChart(canvasId, labels, data, label) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (CHARTS[canvasId]) {
    CHARTS[canvasId].data.labels = labels;
    CHARTS[canvasId].data.datasets[0].data = data;
    CHARTS[canvasId].update();
    return;
  }

  CHARTS[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const emergencyBtn = document.getElementById("emergency-btn");
  if (emergencyBtn) {
    emergencyBtn.addEventListener("click", sendEmergency);
  }

  // refresh iniziale + ogni 30 secondi
  refreshData();
  setInterval(refreshData, 30000);
});
