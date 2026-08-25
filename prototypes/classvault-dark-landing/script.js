const header = document.querySelector('[data-header]')
const menuButton = document.querySelector('[data-menu-button]')
const mobileMenu = document.querySelector('[data-mobile-menu]')
const toast = document.querySelector('[data-toast]')

const setHeaderState = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 18)
}

setHeaderState()
window.addEventListener('scroll', setHeaderState, { passive: true })

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true'
  menuButton.setAttribute('aria-expanded', String(!isOpen))
  mobileMenu.hidden = isOpen
  header?.classList.toggle('menu-open', !isOpen)
  menuButton.querySelector('path')?.setAttribute('d', isOpen ? 'M4 7h16M4 12h16M4 17h16' : 'M5 5l14 14M19 5 5 19')
})

mobileMenu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton?.setAttribute('aria-expanded', 'false')
    mobileMenu.hidden = true
    header?.classList.remove('menu-open')
    menuButton?.querySelector('path')?.setAttribute('d', 'M4 7h16M4 12h16M4 17h16')
  })
})

const productTabs = [...document.querySelectorAll('[data-product-tab]')]
const productViews = [...document.querySelectorAll('[data-product-view]')]

productTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const viewName = tab.dataset.productTab
    productTabs.forEach((item) => {
      const active = item === tab
      item.classList.toggle('is-active', active)
      item.setAttribute('aria-selected', String(active))
    })
    productViews.forEach((view) => {
      const active = view.dataset.productView === viewName
      view.hidden = !active
      view.classList.toggle('is-active', active)
    })
  })
})

const showToast = (message) => {
  if (!toast) return
  toast.textContent = message
  toast.classList.add('is-visible')
  window.clearTimeout(showToast.timeout)
  showToast.timeout = window.setTimeout(() => toast.classList.remove('is-visible'), 1800)
}

document.querySelectorAll('[data-prototype-cta]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault()
    showToast('Prototype only — production navigation is intentionally disconnected')
  })
})

const saveButton = document.querySelector('[data-save-note]')
saveButton?.addEventListener('click', () => {
  const saved = saveButton.getAttribute('aria-pressed') === 'true'
  saveButton.setAttribute('aria-pressed', String(!saved))
  saveButton.classList.toggle('is-saved', !saved)
  saveButton.querySelector('span').textContent = saved ? 'Save' : 'Saved'
  showToast(saved ? 'Removed from your vault' : 'Saved to your vault')
})

document.querySelectorAll('.stage-toolbar button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.stage-toolbar button').forEach((item) => item.classList.remove('is-active'))
    button.classList.add('is-active')
    showToast(`Sorted by ${button.textContent.toLowerCase()}`)
  })
})

document.querySelectorAll('.roadmap-phases li button').forEach((button) => {
  button.addEventListener('click', () => {
    const item = button.closest('li')
    const complete = item.classList.toggle('is-done')
    item.classList.remove('is-current')
    button.textContent = complete ? '✓' : ''
    showToast(complete ? 'Roadmap task completed' : 'Roadmap task reopened')
  })
})

const createTimer = (display, toggleButton, resetButton) => {
  if (!display || !toggleButton) return
  let seconds = 24 * 60 + 59
  let running = true

  const render = () => {
    const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
    const remainder = String(seconds % 60).padStart(2, '0')
    display.textContent = `${minutes}:${remainder}`
  }

  const interval = window.setInterval(() => {
    if (!running) return
    seconds = seconds > 0 ? seconds - 1 : 25 * 60
    render()
  }, 1000)

  toggleButton.addEventListener('click', () => {
    running = !running
    toggleButton.textContent = running
      ? toggleButton.dataset.runningLabel || 'Pause'
      : toggleButton.dataset.pausedLabel || 'Resume'
  })

  resetButton?.addEventListener('click', () => {
    seconds = 25 * 60
    running = false
    toggleButton.textContent = toggleButton.dataset.pausedLabel || 'Resume'
    render()
  })

  window.addEventListener('pagehide', () => window.clearInterval(interval), { once: true })
}

createTimer(
  document.querySelector('[data-hero-timer]'),
  document.querySelector('[data-timer-toggle]'),
  document.querySelector('[data-timer-reset]'),
)

const sectionTimerToggle = document.querySelector('[data-section-timer-toggle]')
if (sectionTimerToggle) {
  sectionTimerToggle.dataset.runningLabel = 'Pause session'
  sectionTimerToggle.dataset.pausedLabel = 'Resume session'
}
createTimer(document.querySelector('[data-section-timer]'), sectionTimerToggle)

const chatForm = document.querySelector('[data-chat-form]')
chatForm?.addEventListener('submit', (event) => {
  event.preventDefault()
  const input = chatForm.querySelector('[data-chat-input]')
  const value = input.value.trim()
  if (!value) return

  const message = document.createElement('div')
  message.className = 'message'
  message.innerHTML = '<i>YOU</i><p><strong>You</strong></p>'
  message.querySelector('p').append(document.createTextNode(value))
  chatForm.before(message)
  input.value = ''
  showToast('Message added to the temporary room')
})

const revealItems = document.querySelectorAll('.reveal')
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('is-visible')
      observer.unobserve(entry.target)
    })
  },
  { threshold: 0.08, rootMargin: '0px 0px -2% 0px' },
)

revealItems.forEach((item) => revealObserver.observe(item))

document.querySelectorAll('.row-action').forEach((button) => {
  button.addEventListener('click', () => {
    const title = button.closest('[data-note-title]')?.dataset.noteTitle || 'Note'
    showToast(`${title} opened in preview`)
  })
})
