import { APP_CONFIG } from "../config/app.config";

async function request(endpoint, options = {}) {
    const response = await fetch(
        `${APP_CONFIG.backendUrl}${endpoint}`,
        {
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
            ...options,
        }
    );

    if (!response.ok) {
        throw new Error(
            `API request failed: ${response.status}`
        );
    }

    return response.json();
}

export const api = {
    get: (endpoint) => request(endpoint),

    post: (endpoint, body) =>
        request(endpoint, {
            method: "POST",
            body: JSON.stringify(body),
        }),
};