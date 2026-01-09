async function main() {
  const status = document.getElementById("status");
  const grid = document.getElementById("grid");

  const res = await fetch("./players-data.json", { cache: "no-store" });
  const data = await res.json();

  grid.innerHTML = data.players.map(p => `
    <div class="card">
      <div>
        <div class="name">${p.name}</div>
        <div class="sub">${p.rank}</div>
      </div>
    </div>
  `).join("");

  status.textContent = "Updated automatically";
}

main();
