// Example of Nouncaster - Algonouns backend to collect content and present a relevant feed
// Example 1: use mbd, to optimise for engagement
//
// Steps:
// 1. decide on filtering criteria (make it Nounish) ✅
//   - read casts from /nouns and /lilnouns
// 2. fetch reccos from mbd ✅
// 3. fetch casts from Fc Hub based on ids
// 4. format them for Nouncaster (convert JSON!?)
// 5. blend with other algos
// 6. feed is ready

import { Injectable } from '@nestjs/common';
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

// TODO: move to types.ts
type MbdItem = {
  itemId: string;
  score: number;
};

type MbdResponse = {
  statusCode: number;
  body: Array<MbdItem>;
};

type Entry = {
  id: string;
  authorUsername: string;
  castHash: string;
  algoId: string;
  text: string;
  timestamp: string;
  upvotes: number;
};

@Injectable()
export class AppService {
  async getEntries(fid: string): Promise<string> {

    const mbdResp = await fetchMbdResponse(fid);
    const itemIds = mbdResp.body.map((_) => _.itemId);

    const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
    const casts = await fetchCasts(itemIds, client);
    const entries = await convertCastsToEntries(casts);

    return JSON.stringify(entries);
  }
}

async function fetchMbdResponse(fid: string): Promise<MbdResponse | null> {
  const url = "https://api.mbd.xyz/v1/farcaster/casts/feed/for-you";
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      // TODO: move the key to env vars
      "x-api-key": "mbd-adf1fe121459b221d863821ec1f010048ad65b46511d3db6004a0e23da1dee9d",
    },
    body: JSON.stringify({
      filters: {
        start_timestamp: "1703157923",
        end_timestamp: "1710933923",
        channels: [
          // TODO: add tips for finding the channel ids
          "chain://eip155:1/erc721:0x558bfff0d583416f7c4e380625c7865821b8e95c",
          "https://warpcast.com/~/channel/yellow",
        ],
        languages: ["en"],
        remove_interactions: ["like", "recast", "reply", "all"],
      },
      user_id: fid,
      scoring: "like",
      top_k: 10,
    }),
  };
  try {
    const resp = await fetch(url, options);
    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }
    return await resp.json() as MbdResponse;
  } catch (err) {
    // TODO: improve error handling
    console.error(err);
  }
  return null;
}

async function fetchCasts(castHashes: Array<string>, client: NeynarAPIClient): Promise<Array<any> | null> {
  const resp = await client.fetchBulkCasts(castHashes);
  return resp?.result?.casts;
}

async function convertCastsToEntries(casts: Array<any>): Promise<Array<Entry>> {
  const entries: Array<Entry> = [];

  for (const cast of casts) {
    const entry: Entry = {
      id: `cast:${cast.hash}`,
      castHash: cast.hash,
      text: cast.text,
      algoId: "",
      timestamp: cast.timestamp,
      upvotes: 0,
      authorUsername: cast.author.username,
    };
    entries.push(entry);
  }

  return entries;
}