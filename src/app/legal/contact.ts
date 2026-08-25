// Operator and grievance-contact details published on the legal pages.
//
// The Information Technology (Intermediary Guidelines and Digital Media Ethics
// Code) Rules, 2021 require an intermediary to publish a named grievance officer
// and a working contact address. Placeholder values are marked and render as a
// visible notice so an unfinished page cannot quietly pass for a complete one.

export const LEGAL_PLACEHOLDER = 'TO BE COMPLETED'

export const legalContact = {
  /** Registered operator. A sole proprietorship is acceptable to name here. */
  operatorName: 'Priyanshu Singh',
  /** Postal address published for grievance correspondence. */
  operatorAddress: 'Greater Noida, Uttar Pradesh 201310, India',
  /** Named individual responsible for grievances under the IT Rules, 2021. */
  grievanceOfficerName: 'Priyanshu Singh',
  /** Monitored inbox. Must be read daily once uploads are open. */
  grievanceEmail: 'hello@priyanshu.co',
  /** General contact shown on the landing page. */
  generalEmail: 'hello@priyanshu.co',
  /** Courts named in the governing-law clause. */
  jurisdiction: 'Greater Noida, Uttar Pradesh',
  /** Last substantive revision of the legal pages. */
  lastUpdated: '25 August 2026',
} as const

export function hasPlaceholders() {
  // Widened because `as const` narrows the value union once every field is
  // filled in, which would otherwise make this comparison a type error rather
  // than the runtime check it is meant to be.
  const values: readonly string[] = Object.values(legalContact)
  return values.includes(LEGAL_PLACEHOLDER)
}
