import * as vscode from "vscode";

export interface StoredCredentials {
  basic?: { username: string; password: string };
  bearer?: { token: string };
}

/**
 * Manages secure storage of credentials using VS Code's SecretStorage API.
 * Credentials are stored per-request ID and are encrypted by VS Code.
 */
export class CredentialsManager {
  private static readonly CREDENTIALS_PREFIX = "postcode.credentials.";

  constructor(private secretStorage: vscode.SecretStorage) {}

  /**
   * Store credentials securely for a specific request
   */
  async storeCredentials(
    requestId: string,
    credentials: StoredCredentials
  ): Promise<void> {
    const key = `${CredentialsManager.CREDENTIALS_PREFIX}${requestId}`;
    await this.secretStorage.store(key, JSON.stringify(credentials));
  }

  /**
   * Retrieve stored credentials for a specific request
   */
  async getCredentials(requestId: string): Promise<StoredCredentials | null> {
    const key = `${CredentialsManager.CREDENTIALS_PREFIX}${requestId}`;
    const data = await this.secretStorage.get(key);
    if (data) {
      try {
        return JSON.parse(data) as StoredCredentials;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Delete credentials for a specific request
   */
  async deleteCredentials(requestId: string): Promise<void> {
    const key = `${CredentialsManager.CREDENTIALS_PREFIX}${requestId}`;
    await this.secretStorage.delete(key);
  }

  /**
   * Store a global credential (not tied to a specific request)
   * Useful for tokens that are reused across multiple requests
   */
  async storeGlobalCredential(name: string, value: string): Promise<void> {
    const key = `${CredentialsManager.CREDENTIALS_PREFIX}global.${name}`;
    await this.secretStorage.store(key, value);
  }

  /**
   * Retrieve a global credential
   */
  async getGlobalCredential(name: string): Promise<string | undefined> {
    const key = `${CredentialsManager.CREDENTIALS_PREFIX}global.${name}`;
    return await this.secretStorage.get(key);
  }

  /**
   * Delete a global credential
   */
  async deleteGlobalCredential(name: string): Promise<void> {
    const key = `${CredentialsManager.CREDENTIALS_PREFIX}global.${name}`;
    await this.secretStorage.delete(key);
  }
}
