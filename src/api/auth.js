export async function signOutAppUser(client, sessionToken) {
  return client.rpc('app_logout', { p_session_token: sessionToken })
}
