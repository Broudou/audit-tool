// Full SPA mode: this app is a client-only shell over the separate Express REST API, so there
// is no server to render on and nothing here is prerenderable per-user.
export const ssr = false;
export const prerender = false;
