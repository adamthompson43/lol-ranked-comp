async function main() {
  const status = document.getElementById("status");
  const grid = document.getElementById("grid");

  const cfg = await (await fetch("./players.json")).json();

  grid.innerHTML = cfg.players.map(p => `
    <div class="card">
      <div class="icon"></div>
      <div>
        <div class="name">${p.gameName}#${p.tagLine}</div>
        <div class="sub">RANKED_SOLO_5x5</div>
      </div>
      <div class="badge">
        <div class="rank">UNRANKED</div>
        <div class="lp">–</div>
      </div>
    </div>
  `).join("");

  status.textContent = "Static test data loaded";
}

main();
