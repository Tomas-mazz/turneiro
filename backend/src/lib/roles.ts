export const PLATFORM_ROLES = ['ADMIN', 'SELLER'] as const
export type PlatformRole = (typeof PLATFORM_ROLES)[number]

export const SHOP_ROLES = ['OWNER', 'STAFF'] as const
export type ShopRole = (typeof SHOP_ROLES)[number]

export const ALL_ROLES = [...PLATFORM_ROLES, ...SHOP_ROLES, 'USER'] as const
export type Role = (typeof ALL_ROLES)[number]

