declare global {
  interface Window {
    plausible: any
  }
}

function isProduction() {
  if (typeof window !== 'undefined') {
    return !!window.location.host.match('entity.id')
  }
}

function isMainnet(chain: string) {
  return chain === 'mainnet'
}

export function setUtm() {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    const utmSource = urlParams.get('utm_source')
    if (utmSource) {
      window.sessionStorage.setItem('utmSource', utmSource)
    }
  }
}

export function getUtm() {
  return window.sessionStorage.getItem('utmSource')
}

export const setupAnalytics = () => {
  setUtm()
}

export const trackEvent = async (type: string, chain: string) => {
  const referrer = getUtm()
  function track() {
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible(type, {
        props: {
          referrer,
        },
      })
    }
  }
  console.log('Event triggering', type, chain)
  if (isProduction() && isMainnet(chain)) {
    track()
  } else {
    console.log(
      'Event triggered on local development',
      JSON.stringify({
        type,
        referrer,
      }),
    )
  }
}
