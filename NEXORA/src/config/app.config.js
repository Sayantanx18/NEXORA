export const APP_CONFIG = {
    name: "NEXORA",
    tagline: "AI Intelligence Interface",
    version: "1.0.0",

    backendUrl:
        import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",

    demoMode:
        import.meta.env.VITE_DEMO_MODE !== "false",

    features: {
        investigation: true,
        evidence: true,
        graph: true,
        reasoning: true,
        nextBestAction: true,
    },
};