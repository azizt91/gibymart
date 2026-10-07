/**
 * Formatting utility functions
 */
import { DAYS_ID, MONTHS_ID, TIMEZONE } from './constants';

/**
 * Format number as Indonesian Rupiah currency
 * @param {number} amount
 * @returns {string} e.g., "Rp 10.000" or "Rp 1.250.000"
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '-';
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(amount))}`;
}

export const formatRupiah = formatCurrency;

/**
 * Format number with dot separator (Indonesian number format)
 * @param {number} num
 * @returns {string} e.g., "10.000"
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Format date to Indonesian display format
 * @param {string|Date} date
 * @returns {string} e.g., "Senin, 5 Oktober 2026"
 */
export function formatDateIndonesian(date) {
  if (!date) return '-';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';
  const dayName = DAYS_ID[d.getDay()] || '';
  const day = d.getDate();
  const month = MONTHS_ID[d.getMonth()] || '';
  const year = d.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
}

/**
 * Format date to short display
 * @param {string|Date} date
 * @returns {string} e.g., "5 Okt 2026"
 */
export function formatDateShort(date) {
  if (!date) return '-';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';
  const day = d.getDate();
  const month = (MONTHS_ID[d.getMonth()] || '').substring(0, 3);
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format date to API format
 * @param {Date|string} date
 * @returns {string} e.g., "2026-10-05"
 */
export function formatDateAPI(date = new Date()) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format time string from HH:mm:ss to HH:mm
 * @param {string} time e.g., "07:58:21"
 * @returns {string} e.g., "07:58"
 */
export function formatTimeShort(time) {
  if (!time) return '-';
  return time.substring(0, 5);
}

/**
 * Format minutes to human readable duration
 * @param {number} minutes
 * @returns {string} e.g., "0:00 Jam", "1:00 Jam", "1:30 Jam"
 */
export function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return '0:00 Jam';
  const minsNum = Number(minutes) || 0;
  const hours = Math.floor(minsNum / 60);
  const mins = minsNum % 60;
  return `${hours}:${String(mins).padStart(2, '0')} Jam`;
}

export const formatMinutesToHours = formatDuration;

/**
 * Format hourly rate with currency and suffix
 * @param {number} rate
 * @returns {string} e.g., "Rp 10.000 / jam"
 */
export function formatHourlyRate(rate) {
  if (rate === null || rate === undefined) return '-';
  return `${formatCurrency(rate)} / jam`;
}

/**
 * Format minutes to hours:minutes display without suffix
 * @param {number} totalMinutes
 * @returns {string} e.g., "0:00", "1:30"
 */
export function formatTotalHours(totalMinutes) {
  if (totalMinutes === null || totalMinutes === undefined) return '0:00';
  const minsNum = Number(totalMinutes) || 0;
  const hours = Math.floor(minsNum / 60);
  const mins = minsNum % 60;
  return `${hours}:${String(mins).padStart(2, '0')}`;
}

/**
 * Get current time in Jakarta timezone
 * @returns {Date}
 */
export function getJakartaTime() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TIMEZONE }));
}

/**
 * Format current time as HH:mm:ss
 * @param {Date} [date]
 * @returns {string}
 */
export function formatCurrentTime(date) {
  const d = date || getJakartaTime();
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: TIMEZONE,
  });
}

/**
 * Truncate text with ellipsis
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength = 30) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get initials from name
 * @param {string} name e.g., "Budi Santoso"
 * @returns {string} e.g., "BS"
 */
export function getInitials(name) {
  if (!name) return '';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Capitalize first letter
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
