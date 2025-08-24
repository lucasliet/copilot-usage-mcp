/**
 * Fetches the current GitHub Copilot usage data from the Copilot API.
 *
 * @param {string} token - The GitHub token with Copilot access.
 * @returns {Promise<object>} A promise that resolves to the Copilot usage data.
 * @throws {Error} If the API request fails or the token is invalid.
 */
export async function fetchCopilotUsage(token) {
  try {
    const response = await fetch('https://api.github.com/copilot_internal/user', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `token ${token}`,
        'Editor-Version': 'vscode/1.98.1',
        'Editor-Plugin-Version': 'copilot-chat/0.26.7',
        'User-Agent': 'GitHubCopilotChat/0.26.7',
        'X-Github-Api-Version': '2025-04-01'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na requisição: ${response.status} ${response.statusText}. Detalhes: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Erro de rede: Não foi possível conectar à API do GitHub. Verifique sua conexão com a internet.');
    }
    throw error;
  }
}
