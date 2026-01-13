function formatClimb(diff) {
  if (diff === null) return "-";
  if (diff === 0) return "→ 0";
  return diff > 0 ? `▲ ${diff}` : `▼ ${Math.abs(diff)}`;
}

function formatClimbNumber(diff) {
  if (diff === null) return "-";
  if (diff === 0) return "0";
  return diff; // keeps negative sign
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

// function to generate opgg url from league id
function opggUrlFromRiotId(riotId, region = "euw") {
  const [gameName, tagLine] = riotId.split("#");
  if (!gameName || !tagLine) return "#";

  return `https://www.op.gg/summoners/${region}/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}?queue_type=SOLORANKED`;
}


async function main() {
  const status = document.getElementById("status");
  const grid = document.getElementById("grid");

  const res = await fetch("./players-data.json", { cache: "no-store" });
  const data = await res.json();

  const sortedPlayers = [...data.players].sort((a, b) => {
  const aVal = a.lpDiffOfPeak ?? -Infinity;
  const bVal = b.lpDiffOfPeak ?? -Infinity;
  return bVal - aVal; // highest first
  });

  grid.innerHTML = sortedPlayers.map((p, index) => {

    // getting place in competition
    const place = index + 1;

    // generating opgg url
    const opggUrl = opggUrlFromRiotId(p.name, "euw");

    const lpDiff = isRanked(p.currentRank) ? (p.lpDiff ?? null) : null;
    const peakDiff = isRanked(p.peakRank) ? (p.lpDiffOfPeak ?? null) : null;

    return `
      <div class="card">
        <div class="cell place">${place}</div>

        <div class="cell name">
            <a class="name-link" href="${opggUrl}" target="_blank" rel="noopener noreferrer">
                ${p.name}
            </a>
        </div>

        <div class="cell rank">
          ${p.currentRank}${p.currentLP !== null ? ` - ${p.currentLP} LP` : ""}
        </div>

        <div class="cell peak rank">
          ${p.peakRank}${p.peakLP !== null ? ` - ${p.peakLP} LP` : ""}
        </div>

        <div class="cell start-rank">
        ${p.startingRank}${p.startingLP !== null ? ` - ${p.startingLP} LP` : ""}
        </div>

        <div class="cell games">
        ${calcGames(p.wins, p.losses)}
        </div>

        <div class="cell winrate">
        ${p.name === "CableB#top" ? "REDACTED" : calcWinrate(p.wins, p.losses)}
        </div>

        <div class="cell climb ${lpDiff > 0 ? "positive" : lpDiff < 0 ? "negative" : ""}">
        ${lpDiff === null ? "-" : `${formatClimb(lpDiff)} LP`}
        </div>

        <div class="cell peak climb">
          ${formatClimbNumber(peakDiff)}
        </div>
      </div>
    `;
  }).join("");

  const infoCard = document.createElement("div");
    infoCard.className = "card info-text-card";
    infoCard.innerHTML = `
    <div class="info-content">
        <h3>Info</h3>
        <p>
        This leaderboard is SUPPOSED to update frequently but it probably won't : )
        </p>
        <p>
        As of 13 January 2026 it's updating every 15-30 minutes. If it gets worse I might try to fix that but no promises
        </p>
        <p>
        Also do not look at this site on mobile please thanks
        </>
    </div>
    `;
grid.appendChild(infoCard);

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
