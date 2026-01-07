import { Client, Account, Databases, Users } from "node-appwrite";

const endpoint = process.env.APPWRITE_ENDPOINT!;
const projectId = process.env.APPWRITE_PROJECT_ID!;
const apiKey = process.env.APPWRITE_API_KEY!;

/**
 * Server-side Appwrite client with API Key for privileged operations.
 * Use this only in API routes or server actions.
 */
export function createAdminClient() {
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
    get users() {
      return new Users(client);
    },
  };
}

/**
 * Standard server-side client using the user's current session/JWT.
 */
export function createSessionClient(jwt?: string) {
  const client = new Client().setEndpoint(endpoint).setProject(projectId);

  if (jwt) {
    client.setJWT(jwt);
  }

  return {
    get account() {
      return new Account(client);
    },
  };
}
