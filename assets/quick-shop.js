import { executeJSmodules } from '@archetype-themes/utils/utils'

/*============================================================================
  QuickShop
  - Setup quick shop modals anywhere a product grid item exists
  - Duplicate product modals will be condensed down to one workable one
==============================================================================*/

class QuickShop extends HTMLElement {
  constructor() {
    super()

    this.selectors = {
      quickShopContainer: '[data-tool-tip-content]',
      blocksHolder: '[data-blocks-holder]',
      blocks: '[data-product-blocks]',
      form: '.product-single__form'
    }

    this.addEventListener('tooltip:interact', async (e) => {
      if (e.detail.context === 'QuickShop') {
        await this.ensureQuickShopData(e)
      }
    })

    this.addEventListener('tooltip:open', async (e) => {
      if (e.detail.context === 'QuickShop') {
        await this.ensureQuickShopData(e)

        const quickShopContainer = this.getQuickShopContainer()
        if (quickShopContainer && this.quickShopData) {
          const clonedQuickShopData = this.quickShopData.cloneNode(true)
          quickShopContainer.innerHTML = ''
          quickShopContainer.appendChild(clonedQuickShopData)
        }

        /**
         * @event quickshop:opened
         * @description Triggered when the quick shop modal is opened.
         * @param {boolean} bubbles - Whether the event bubbles up through the DOM or not.
         */
        this.dispatchEvent(
          new CustomEvent('quickshop:opened', {
            bubbles: true
          })
        )

        if (Shopify && Shopify.PaymentButton) {
          Shopify.PaymentButton.init()
        }

        // Execute JS modules after the tooltip is opened
        const scripts = document.querySelectorAll(`tool-tip [data-product-id="${this.prodId}"] script[type="module"]`)
        executeJSmodules(scripts)
      }
    })

    // Set up product blocks content inside modal
    this.addEventListener('quickshop:opened', async () => {
      if (Shopify && Shopify.PaymentButton) {
        Shopify.PaymentButton.init()
      }
    })
  }

  getQuickShopContainer() {
    return (
      document.querySelector('tool-tip[data-tool-tip="QuickShop"] [data-tool-tip-content]') ||
      document.querySelector(this.selectors.quickShopContainer)
    )
  }

  async ensureQuickShopData(evt) {
    if (this.quickShopData) return this.quickShopData
    if (this.quickShopDataPromise) return this.quickShopDataPromise

    this.quickShopDataPromise = this.loadQuickShopData(evt)
      .then((data) => {
        if (data) {
          this.quickShopData = data
        }
        return this.quickShopData || null
      })
      .finally(() => {
        this.quickShopDataPromise = null
      })

    return this.quickShopDataPromise
  }

  async loadQuickShopData(evt) {
    const gridItem = evt.currentTarget.closest('.grid-product')
    this.handle = gridItem.firstElementChild.getAttribute('data-product-handle')
    this.prodId = gridItem.firstElementChild.getAttribute('data-product-id')

    if (!gridItem || !this.handle || !this.prodId) return

    let url = `${window.Shopify.routes.root}/products/${this.handle}`

    // remove double `/` in case shop might have /en or language in URL
    url = url.replace('//', '/')

    try {
      const response = await fetch(url)
      const text = await response.text()
      const responseHTML = new DOMParser().parseFromString(text, 'text/html')
      const fragment = document.createDocumentFragment()

      const div = responseHTML.querySelector(`.page-content[data-product-id="${this.prodId}"]`)
      this.processHTML(div)

      if (div) {
        div.dataset.modal = true
        fragment.appendChild(div.cloneNode(true))
      }

      /**
       * @event quickshop:loaded-${productId}
       * @description Triggered when the quick shop modal is loaded.
       */
      window.dispatchEvent(new CustomEvent(`quickshop:loaded-${this.prodId}`))
      return fragment
    } catch (error) {
      console.error('Error:', error)
    }
  }

  processHTML(productElement) {
    this.removeBreadcrumbs(productElement)
    this.preventVariantURLSwitching(productElement)
  }

  removeBreadcrumbs(productElement) {
    const breadcrumbs = productElement.querySelector('.breadcrumb')
    if (!breadcrumbs) return

    breadcrumbs.remove()
  }

  preventVariantURLSwitching(productElement) {
    const variantPicker = productElement.querySelector('block-variant-picker')
    if (!variantPicker) return

    variantPicker.removeAttribute('data-update-url')
  }
}

customElements.define('quick-shop', QuickShop)
