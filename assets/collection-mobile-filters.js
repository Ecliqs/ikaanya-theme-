import { unlockMobileScrolling, lockMobileScrolling } from '@archetype-themes/utils/a11y'
import { EVENTS } from '@archetype-themes/utils/events'
import { prepareTransition } from '@archetype-themes/utils/utils'

class CollectionMobileFilters extends HTMLElement {
  connectedCallback() {
    this.selectors = {
      filters: '.filter-wrapper',
      inlineWrapper: '#CollectionInlineFilterWrap',
      sortBtn: '.filter-sort'
    }
    this.config = {
      mobileFiltersInPlace: false,
      isOpen: window.__ikaanyaCollectionFiltersOpen === true,
      preventAutoClose: document.body.classList.contains('template-collection')
    }

    this.syncOpenClass()

    this.mobileMediaQuery = window.matchMedia(`(max-width: 768px)`)

    this.handleMediaQueryChange = this.handleMediaQueryChange.bind(this)
    this.mobileMediaQuery.addListener(this.handleMediaQueryChange)
    this.handleMediaQueryChange(this.mobileMediaQuery)

    this.abortController = new AbortController()

    document.addEventListener(EVENTS.toggleMobileFilters, this.toggle.bind(this), {
      signal: this.abortController.signal
    })
    // document.addEventListener('filter:selected', this.close.bind(this), {
    //   signal: this.abortController.signal
    // })
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  async renderFiltersOnMobile() {
    if (this.config.mobileFiltersInPlace) {
      return
    }

    const inlineWrapper = this.querySelector(this.selectors.inlineWrapper)
    if (!inlineWrapper) return

    let filters = null
    try {
      filters = await this.getFilters()
    } catch (error) {
      return
    }
    if (!filters) return

    const shouldStayOpen =
      this.config.isOpen ||
      window.__ikaanyaCollectionFiltersOpen === true ||
      document.documentElement.classList.contains('collection-filters-force-open')

    if (shouldStayOpen) {
      filters.classList.add('is-active')
    }

    // When using sidebar clone source, ensure the mobile close icon exists.
    if (!filters.id) {
      filters.id = 'custom-filter-menu'
    }
    if (!filters.querySelector('#custom-filter-menu-button')) {
      const closeBtn = document.createElement('button')
      closeBtn.type = 'button'
      closeBtn.id = 'custom-filter-menu-button'
      closeBtn.className = 'collection-filter__btn text-link'
      closeBtn.textContent = 'Apply'
      filters.prepend(closeBtn)
    }

    inlineWrapper.innerHTML = ''
    inlineWrapper.append(filters)

    this.sortBtns = this.querySelectorAll(this.selectors.sortBtn)
    if (this.sortBtns.length) {
      this.sortBtns.forEach((btn) =>
        btn.addEventListener('click', this.handleSortButtonClick.bind(this), { signal: this.abortController.signal })
      )
    }

    this.config.mobileFiltersInPlace = true

    // AJAX reload recreates this component and resets inner HTML.
    // Re-open if it was open before reload.
    if (shouldStayOpen) {
      this.config.isOpen = true
      this.open()
    }
  }

  handleSortButtonClick(evt) {
    const btn = evt.currentTarget
    this.close('sort')
    const sortValue = btn.dataset.value
    this.dispatchEvent(new CustomEvent(EVENTS.sortSelected, { detail: { sortValue }, bubbles: true }))
  }

  handleMediaQueryChange(mql) {
    this.renderFiltersOnMobile()
  }

  /*============================================================================
    Open and close filter drawer
  ==============================================================================*/
  toggle() {
    if (this.config.isOpen) {
      this.close('toggle')
    } else {
      this.open()
    }
  }

  open() {
    const filters = this.querySelector(this.selectors.filters)
    if (!filters) return

    prepareTransition(filters, () => filters.classList.add('is-active'))

    this.config.isOpen = true
    window.__ikaanyaCollectionFiltersOpen = true
    this.syncOpenClass()

    lockMobileScrolling()

    // Bind the keyup event handler
    this._keyupHandler = (evt) => {
      if (evt.keyCode === 27) {
        this.close('escape')
      }
    }
    window.addEventListener('keyup', this._keyupHandler, {
      signal: this.abortController.signal
    })
  }

  close(source = 'system') {
    if (this.config.preventAutoClose && source !== 'icon') {
      return
    }

    const filters = this.querySelector(this.selectors.filters)
    if (!filters) return

    prepareTransition(filters, () => filters.classList.remove('is-active'))

    this.config.isOpen = false
    window.__ikaanyaCollectionFiltersOpen = false
    this.syncOpenClass()

    unlockMobileScrolling()

    // Remove the keyup event handler
    window.removeEventListener('keyup', this._keyupHandler)
  }

  async getFilters() {
    // Prefer instant clone from the current sidebar DOM to avoid AJAX flicker.
    const liveSidebarFilters = document.querySelector('#CollectionSidebarFilterWrap .filter-wrapper')
    if (liveSidebarFilters) {
      return liveSidebarFilters.cloneNode(true)
    }

    const searchParams = window.location.search.slice(1)
    const url = `${window.location.pathname}?section_id=item-grid-filters&${searchParams}`
    const response = await fetch(url)

    if (!response.ok) {
      throw response
    }

    const responseText = await response.text()
    const html = new DOMParser().parseFromString(responseText, 'text/html')
    return html.querySelector(this.selectors.filters)
  }

  syncOpenClass() {
    document.documentElement.classList.toggle('collection-filters-force-open', this.config.isOpen)
  }
}

customElements.define('collection-mobile-filters', CollectionMobileFilters)
