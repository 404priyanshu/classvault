// Operator and grievance-contact details published on the legal pages.
//
// FILL THESE IN BEFORE THE FIRST NON-SELF UPLOAD. The Information Technology
// (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 require an
// intermediary to publish a named grievance officer and a working contact
// address. Placeholder values are marked and render as a visible notice so an
// unfinished page cannot quietly pass for a complete one.

export const LEGAL_PLACEHOLDER = 'TO BE COMPLETED'

export const legalContact = {
  /** Registered operator. A sole proprietorship is acceptable to name here. */
  operatorName: LEGAL_PLACEHOLDER,
  /** Postal address published for grievance correspondence. */
  operatorAddress: LEGAL_PLACEHOLDER,
  /** Named individual responsible for grievances under the IT Rules, 2021. */
  grievanceOfficerName: LEGAL_PLACEHOLDER,
  /** Monitored inbox. Must be read daily once uploads are open. */
  grievanceEmail: 'hello@classvault.in',
  /** General contact shown on the landing page. */
  generalEmail: 'hello@classvault.in',
  /** Courts named in the governing-law clause. */
  jurisdiction: LEGAL_PLACEHOLDER,
  /** Last substantive revision of the legal pages. */
  lastUpdated: '29 August 2026',
} as const

export function hasPlaceholders() {
  return Object.values(legalContact).includes(LEGAL_PLACEHOLDER)
}
