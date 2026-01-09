import fs from "fs";

const RIOT_KEY = process.env.RIOT_API_KEY;
if (!RIOT_KEY) {
  console.error("Missing RIOT_API_KEY");
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync("players.json", "utf8"));
const players = cfg.players;

// Europe-only
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

  return {
  name: `${gameName}#${tagLine}`,
  rank: solo ? `${solo.tier} ${solo.rank}` : "UNRANKED",
  lp: solo ? solo.leaguePoints : null,
  wins: solo ? solo.wins : null,
  losses: solo ? solo.losses : null,

  startingRank,
  startingLP
  };
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
