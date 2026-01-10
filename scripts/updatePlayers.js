import fs from "fs";

const RIOT_KEY = process.env.RIOT_API_KEY;
if (!RIOT_KEY) {
  console.error("Missing RIOT_API_KEY");
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync("players.json", "utf8"));
const players = cfg.players;

const REGIONAL = "europe";
const PLATFORM = "euw1";

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
  if (!rank || rank === "UNRANKED") return null;

  const idx = RANK_ORDER.indexOf(rank);
  if (idx === -1) return null;

  return idx * 100 + lp;
}

async function riotFetch(url) {
  const res = await fetch(url, {
    headers: { "X-Riot-Token": RIOT_KEY }
  });
  if (!res.ok) {
    throw new Error(`Riot ${res.status}`);
  }
  return res.json();
}

async function getPlayerRank({ gameName, tagLine, startingRank, startingLP }) {
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

  const currentPoints = rankToPoints(currentRank, currentLP);

  const prev = previousData.players.find(
    p => p.name === `${gameName}#${tagLine}`
  );

  const previousPeak = prev?.competitionPeakPoints ?? null;

  const competitionPeakPoints =
    currentPoints != null
      ? Math.max(previousPeak ?? currentPoints, currentPoints)
      : previousPeak;

  return {
  name: `${gameName}#${tagLine}`,
  currentRank,
  currentLP,
  wins: solo ? solo.wins : 0,
  losses: solo ? solo.losses : 0,

  startingRank,
  startingLP,

  competitionPeakPoints
  };
}

let previousData = { players: [] };

if (fs.existsSync("players-data.json")) {
  previousData = JSON.parse(fs.readFileSync("players-data.json", "utf8"));
}


async function main() {
  const result = [];

  for (const p of players) {
    result.push(await getPlayerRank(p));
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
