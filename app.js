async function main() {
  const status = document.getElementById("status");
  const grid = document.getElementById("grid");

  const res = await fetch("./players-data.json", { cache: "no-store" });
  const data = await res.json();

  grid.innerHTML = data.players.map(p => `
    <div class="card">
      <div>
        <div class="name">${p.name}</div>
        <div class="sub">
          ${p.rank}${p.lp !== null ? ` - ${p.lp} LP` : ""}
        </div>
      </div>
    </div>
  `).join("");

  const updatedAt = new Date(data.updatedAt);
  status.textContent = `Last updated: ${updatedAt.toLocaleString()}`;
}

main();
