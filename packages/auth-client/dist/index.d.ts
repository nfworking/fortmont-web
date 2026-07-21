export interface OAuthConfig {
    issuer?: string;
    authBaseUrl?: string;
    clientId: string;
    redirectUri: string;
    scopes?: string[];
    clientSecret?: string;
}
export interface FortmontDiscoveryDocument {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    userinfo_endpoint: string;
    jwks_uri: string;
    response_types_supported?: string[];
    subject_types_supported?: string[];
    id_token_signing_alg_values_supported?: string[];
    scopes_supported?: string[];
    token_endpoint_auth_methods_supported?: string[];
    code_challenge_methods_supported?: string[];
    grant_types_supported?: string[];
    claims_supported?: string[];
}
export interface FortmontTokenResponse {
    access_token: string;
    token_type: string;
    expires_in?: number;
    scope?: string;
    refresh_token?: string;
    id_token?: string;
}
export interface FortmontUserInfo {
    sub: string;
    email?: string;
    name?: string;
    picture?: string;
    [key: string]: unknown;
}
export interface PkcePair {
    verifier: string;
    challenge: string;
}
export interface FortmontClientConfig extends OAuthConfig {
    issuer: string;
}
export declare function getDiscoveryUrl(issuer: string): string;
export declare function getAuthorizationUrl(config: OAuthConfig, state?: string, codeChallenge?: string): string;
export declare function buildAuthUrl(config: OAuthConfig, state?: string, codeChallenge?: string): string;
export declare function getTokenUrl(configOrIssuer: OAuthConfig | string): string;
export declare function getUserInfoUrl(configOrIssuer: OAuthConfig | string): string;
export declare function getDiscoveryDocument(configOrIssuer: OAuthConfig | string): Promise<FortmontDiscoveryDocument>;
export declare function exchangeCode(config: OAuthConfig, code: string, codeVerifier?: string): Promise<FortmontTokenResponse>;
export declare function fetchUserInfo(accessToken: string, userInfoEndpointOrIssuer: string): Promise<FortmontUserInfo>;
export declare function generateState(length?: number): string;
export declare function generateCodeVerifier(length?: number): string;
export declare function generateCodeChallenge(verifier: string): Promise<string>;
export declare function createPkcePair(length?: number): Promise<PkcePair>;
export declare function createAuthorizationUrlFromDiscovery(discovery: FortmontDiscoveryDocument, clientId: string, redirectUri: string, scopes?: string[], state?: string, codeChallenge?: string, nonce?: string): string;
