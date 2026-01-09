const RANK_ORDER = [
  "IRON IV","IRON III","IRON II","IRON I",
  "BRONZE IV","BRONZE III","BRONZE II","BRONZE I",
  "SILVER IV","SILVER III","SILVER II","SILVER I",
  "GOLD IV","GOLD III","GOLD II","GOLD I",
  "PLATINUM IV","PLATINUM III","PLATINUM II","PLATINUM I",
  "EMERALD IV","EMERALD III","EMERALD II","EMERALD I",
  "DIAMOND IV","DIAMOND III","DIAMOND II","DIAMOND I",
  "MASTER","GRANDMASTER","CHALLENGER"
];

function rankToPoints(rank, lp = 0) {
  if (rank === "UNRANKED") return 0;

  const idx = RANK_ORDER.indexOf(rank);
  if (idx === -1) return 0;

  return idx * 100 + lp;
}

function formatClimb(diff) {
  if (diff === null) return "-";
  if (diff === 0) return "±0 LP";
  return diff > 0 ? `+${diff} LP` : `${diff} LP`;
}

function calcWinrate(wins, losses) {
  if (wins == null || losses == null) return "-";

  const total = wins + losses;
  if (total === 0) return "-";

  return `${((wins / total) * 100).toFixed(1)}%`;
}

function calcGames(wins, losses) {
    if (wins == null || losses == null) return "0";
    return wins + losses;
    }

function isRanked(rank) {
  return rank && rank !== "UNRANKED";
}

async function main() {
  const status = document.getElementById("status");
  const grid = document.getElementById("grid");

  const res = await fetch("./players-data.json", { cache: "no-store" });
  const data = await res.json();

  grid.innerHTML = data.players.map(p => {
    let lpDiff = null;

    if (isRanked(p.currentRank)) {
        const startPoints = rankToPoints(p.startingRank, p.startingLP);
        const currentPoints = rankToPoints(p.currentRank, p.currentLP);
        lpDiff = currentPoints - startPoints;
    }

    return `
      <div class="card">
        <div class="cell name">${p.name}</div>

        <div class="cell rank">
          ${p.currentRank}${p.currentLP !== null ? ` - ${p.currentLP} LP` : ""}
        </div>

        <div class="cell start-rank">
        ${p.startingRank}${p.startingLP !== null ? ` - ${p.startingLP} LP` : ""}
        </div>

        <div class="cell games">
        ${calcGames(p.wins, p.losses)}
        </div>

        <div class="cell winrate">
        ${calcWinrate(p.wins, p.losses)}
        </div>

        <div class="cell climb ${lpDiff > 0 ? "positive" : lpDiff < 0 ? "negative" : ""}">
          ${formatClimb(lpDiff)}
        </div>
      </div>
    `;
  }).join("");

  const updatedAt = new Date(data.updatedAt);
  status.textContent = `Last updated: ${updatedAt.toLocaleString()}`;
}

main();
