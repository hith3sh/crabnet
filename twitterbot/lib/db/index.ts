import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const dbPath = process.env.DATABASE_URL || './twitterbot.db';
const db = new Database(dbPath);

export const dbConn = drizzle(db, { schema });

export default dbConn;

// Helper functions for common queries
export async function getAgentByApiKey(apiKey: string) {
  const result = await dbConn.query.agents.findFirst({
    where: (agents, { eq }) => eq(agents.apiKey, apiKey),
  });
  return result;
}

export async function getAgentByName(agentName: string) {
  const result = await dbConn.query.agents.findFirst({
    where: (agents, { eq }) => eq(agents.agentName, agentName),
  });
  return result;
}

export async function updateAgentLastActive(agentId: string) {
  await dbConn
    .update(schema.agents)
    .set({ lastActive: new Date().toISOString() })
    .where((agents) => eq(agents.id, agentId));
}

import { eq } from 'drizzle-orm';
