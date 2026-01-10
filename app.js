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

// dont understand too much whats going on here but it seems to work so im not touching it for now
function startCountdown() {
  const el = document.getElementById("countdown");
  if (!el) return;

  // target = 00:00 on the 9th CET
  // CET = UTC+1 
  const target = new Date("2026-03-09T00:00:00+01:00");

  function tick() {
    const now = new Date();
    const diff = target - now;

    if (diff <= 0) {
      el.textContent = "Competition ended";
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    el.textContent =
      `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  tick();
  setInterval(tick, 1000);
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
  const now = new Date();

  const diffMs = now - updatedAt;
    const diffMinutes = Math.floor(diffMs / 60000);

    let text;
    if (diffMinutes < 1) {
    text = "just now";
    } else if (diffMinutes === 1) {
    text = "1 minute ago";
    } else if (diffMinutes < 60) {
    text = `${diffMinutes} minutes ago`;
    } else {
    const hours = Math.floor(diffMinutes / 60);
    text = hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    }

    status.textContent = `Last updated: ${text}`;

  startCountdown();
}

main();
