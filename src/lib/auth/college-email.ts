/** Whether an address is on one of a university's domains, subdomains included. */
export function isEmailOnDomains(email: string, domains: string[]) {
  const emailDomain = email.split('@')[1]?.toLowerCase() ?? ''
  return domains.some(
    (domain) => emailDomain === domain || emailDomain.endsWith(`.${domain}`),
  )
}
