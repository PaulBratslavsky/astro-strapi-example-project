import { strapi } from '@strapi/client';

const BASE_API_URL = (import.meta.env.STRAPI_BASE_URL ?? "http://localhost:1337") + "/api";
const strapiClient = strapi({ baseURL: BASE_API_URL });
export { strapiClient };
