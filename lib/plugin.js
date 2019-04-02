import Vue from 'vue'

class ReCaptcha {
  constructor ({ hideBadge, siteKey, version }) {
    if (!siteKey) {
      throw new Error('ReCaptcha error: No key provided')
    }

    if (!version) {
      throw new Error('ReCaptcha error: No version provided')
    }

    this._ready = false

    this.siteKey = siteKey
    this.hideBadge = hideBadge
    this.version = version
  }

  init () {
    if (this._ready) {
      return Promise.resolve()
    }

    const scriptElement = document.createElement('script')
    const styleElement = document.createElement('style')

    const src = 'https://www.recaptcha.net/recaptcha/api.js'

    scriptElement.addEventListener('error', () => {
      document.head.removeChild(scriptElement)
      throw new Error('ReCaptcha error: Failed to load script')
    })

    scriptElement.setAttribute('async', '')
    scriptElement.setAttribute('defer', '')
    scriptElement.setAttribute('src', this.version === 2 ? src : src.concat(`?render=${this.siteKey}`))

    document.head.appendChild(scriptElement)

    this._ready = new Promise(resolve => {
      scriptElement.addEventListener('load', () => {
        if (this.version === 3 && this.hideBadge) {
          styleElement.innerHTML = '.grecaptcha-badge { display: none }'
          document.head.appendChild(styleElement)
        }

        window.grecaptcha.ready(() => {
          resolve()
        })
      })
    })

    return this._ready
  }

  async execute (action) {
    try {
      await this.init()

      if ('grecaptcha' in window) {
        return window.grecaptcha.execute(
          this.siteKey,
          { action }
        )
      }
    } catch (error) {
      throw new Error('ReCaptcha error: Failed to execute')
    }
  }

  getResponse() {
    return new Promise((resolve, reject) => {
      if ('grecaptcha' in window) {
        const response = window.grecaptcha.getResponse()

        if (response) {
          resolve(response)
        } else {
          reject()
        }
      }
    })
  }
}

export default function (_, inject) {
  Vue.component('recaptcha', () => import('./recaptcha.vue'))
  inject('recaptcha', new ReCaptcha(<%= serialize(options) %>))
}
