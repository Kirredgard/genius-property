/**
 * @typedef {Object} Tenant
 * @property {string} [id]
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} [phone]
 * @property {string} [email]
 * @property {string} [propertyId]
 * @property {string} [status]
 * @property {number} [monthlyRent]
 */

/**
 * @typedef {Object} Property
 * @property {string} [id]
 * @property {string} title
 * @property {string} address
 * @property {string} [city]
 * @property {string} [type]
 * @property {number} [monthlyRent]
 * @property {string} [status]
 */

/**
 * @typedef {Object} Contract
 * @property {string} [id]
 * @property {string} tenantId
 * @property {string} propertyId
 * @property {string} startDate
 * @property {string} [endDate]
 * @property {number} monthlyRent
 * @property {number} [deposit]
 * @property {string} [status]
 */

/**
 * @typedef {Object} NotificationItem
 * @property {string} [id]
 * @property {string} type
 * @property {string} severity
 * @property {string} title
 * @property {string} message
 * @property {boolean} [read]
 */

export {};
