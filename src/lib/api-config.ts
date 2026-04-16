const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

function normalizeApiBaseUrl(value: string): string {
	const normalizedValue = value.replace(/\/$/, '')

	if (normalizedValue.endsWith('/api')) {
		return normalizedValue
	}

	return `${normalizedValue}/api`
}

export const API_BASE_URL = normalizeApiBaseUrl(rawApiBaseUrl || 'https://persistnet.azurewebsites.net')