import fs from "fs";

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

const RIOT_KEY = process.env.RIOT_API_KEY;
if (!RIOT_KEY) {
  console.error("Missing RIOT_API_KEY");
  process.exit(1);
}

function rankToPoints(rank, lp = 0) {
  if (!rank || rank === "UNRANKED") return 0;
  const idx = RANK_ORDER.indexOf(rank);
  if (idx === -1) return 0;
  return idx * 100 + (lp ?? 0);
}

const cfg = JSON.parse(fs.readFileSync("players.json", "utf8"));
const players = cfg.players;

// loading previous peaks from last run, so peak persists across runs
let previousPeaks = new Map();

try {
  const prev = JSON.parse(fs.readFileSync("players-data.json", "utf8"));
  for (const p of prev.players ?? []) {
    if (p?.name) previousPeaks.set(p.name, { peakRank: p.peakRank, peakLP: p.peakLP });
  }
} catch {
  // first run or missing players-data.json -> ignore
}

const REGIONAL = "europe";
const PLATFORM = "euw1";

async function riotFetch(url) {
  const res = await fetch(url, {
    headers: { "X-Riot-Token": RIOT_KEY }
  });
  if (!res.ok) {
    throw new Error(`Riot ${res.status}`);
  }
  return res.json();
}

async function getPlayerRank({ gameName, tagLine, startingRank, startingLP, peakRank, peakLP }) {
  // riot id to puuid
  const account = await riotFetch(
    `https://${REGIONAL}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  );

  // rank by puuid
  const entries = await riotFetch(
    `https://${PLATFORM}.api.riotgames.com/lol/league/v4/entries/by-puuid/${account.puuid}`
  );

  const solo = entries.find(e => e.queueType === "RANKED_SOLO_5x5");

  const currentRank = solo ? `${solo.tier} ${solo.rank}` : "UNRANKED";
  const currentLP = solo ? solo.leaguePoints : 0;

  let bestRank = peakRank ?? "UNRANKED";
  let bestLP = peakLP ?? 0;

  const currentPoints = rankToPoints(currentRank, currentLP);
  const oldPeakPoints = rankToPoints(bestRank, bestLP);

  if (currentPoints > oldPeakPoints) {
    bestRank = currentRank;
    bestLP = currentLP;
  }

  const peakPoints = rankToPoints(bestRank, bestLP);

  const startingPoints = rankToPoints(startingRank, startingLP);
  
  const lpDiff = (currentRank === "UNRANKED") ? null : (currentPoints - startingPoints);

  const lpDiffOfPeak = (bestRank === "UNRANKED") ? null : (peakPoints - startingPoints);

  return {
  name: `${gameName}#${tagLine}`,
  currentRank,
  currentLP,
  wins: solo ? solo.wins : 0,
  losses: solo ? solo.losses : 0,

  startingRank,
  startingLP,

  peakRank: bestRank,
  peakLP: bestLP,
  peakPoints,
  lpDiff,
  lpDiffOfPeak
  };
}

async function main() {
  const result = [];

  for (const p of players) {
  const nameKey = `${p.gameName}#${p.tagLine}`;
  const prevPeak = previousPeaks.get(nameKey);

  result.push(await getPlayerRank({
    ...p,
    peakRank: prevPeak?.peakRank ?? p.peakRank,
    peakLP: prevPeak?.peakLP ?? p.peakLP
  }));
}

  fs.writeFileSync(
  "players-data.json",
  JSON.stringify(
    {
      updatedAt: new Date().toISOString(),
      players: result
    },
    null,
    2
  )
);

  console.log("Updated players-data.json");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
