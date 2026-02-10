/**
 * Destiny.gg extension for Omni Screen
 * Registers the DGG chat source and sets renderer config so the app can show DGG chat, embeds, emotes, flairs.
 */
(function () {
  'use strict'

  const DGG_CONFIG = {
    chatWssUrl: 'wss://chat.destiny.gg/ws',
    chatOrigin: 'https://www.destiny.gg',
    liveWssUrl: 'wss://live.destiny.gg/',
    liveOrigin: 'https://www.destiny.gg',
    baseUrl: 'https://www.destiny.gg',
    apiMe: '/api/chat/me',
    apiUserinfo: '/api/userinfo',
    apiUnread: '/api/messages/unread',
    apiInboxPath: '/api/messages/usr',
    emotesJsonUrl: 'https://cdn.destiny.gg/emotes/emotes.json',
    emotesCssUrl: 'https://cdn.destiny.gg/emotes/emotes.css',
    flairsJsonUrl: 'https://cdn.destiny.gg/flairs/flairs.json',
    flairsCssUrl: 'https://cdn.destiny.gg/flairs/flairs.css',
    cookieDomains: ['www.destiny.gg', 'chat.destiny.gg', '.destiny.gg'],
    loginUrl: 'https://www.destiny.gg/login',
  }

  function register(context) {
    if (!context) return
    if (typeof context.registerChatSource === 'function') {
      context.registerChatSource('dgg', {
        getConfig: function () {
          return DGG_CONFIG
        },
      })
    }
    if (typeof context.setRendererConfig === 'function') {
      context.setRendererConfig({
        dgg: {
          baseUrl: DGG_CONFIG.baseUrl,
          loginUrl: DGG_CONFIG.loginUrl,
          emotesJsonUrl: DGG_CONFIG.emotesJsonUrl,
          emotesCssUrl: DGG_CONFIG.emotesCssUrl,
          flairsJsonUrl: DGG_CONFIG.flairsJsonUrl,
          flairsCssUrl: DGG_CONFIG.flairsCssUrl,
          platformIconUrl: DGG_CONFIG.baseUrl + '/favicon.ico',
        },
        connectionPlatforms: [
          {
            id: 'dgg',
            label: 'Destiny.gg (DGG)',
            loginUrl: DGG_CONFIG.loginUrl,
            loginService: 'destiny',
            description: 'Used for DGG chat (combined chat), whispers, and DGG API.',
            cookieNames: ['sid', 'rememberme'],
            snippet: "(function(){var n=['sid','rememberme'];var c=document.cookie.split(';').map(function(s){var i=s.indexOf('=');return i>=0?[s.slice(0,i).trim(),s.slice(i+1).trim()]:null}).filter(Boolean);var o=c.filter(function(p){return n.indexOf(p[0])>=0}).map(function(p){return p[0]+'='+p[1]}).join('; ');console.log('Paste this into Omni Screen:',o);try{copy(JSON.stringify(o))}catch(e){}return o;})()",
            httpOnlyNote: 'DGG session cookies (sid, rememberme) are httpOnly. Use "Log in in browser" below or fill the fields manually (copy from DevTools → Application → Cookies).',
            manualCookieNames: ['sid', 'rememberme'],
          },
        ],
      })
    }
    if (typeof context.registerSettings === 'function') {
      context.registerSettings([
        {
          id: 'dgg-combined',
          label: 'Combined chat',
          placement: 'omni_screen',
          fields: [
            { key: 'includeInCombined', type: 'boolean', label: 'Include DGG', default: true },
            { key: 'showInput', type: 'boolean', label: 'Show DGG chat input', default: true },
            { key: 'flairsAndColors', type: 'boolean', label: 'DGG flairs and colors', default: true, description: 'When off, DGG nicks use a single color and no flair icons.' },
            { key: 'labelColor', type: 'string', label: 'DGG label color', default: '', placeholder: '#ffffff', description: 'Badge color in combined chat. Clear = theme default.' },
            { key: 'labelText', type: 'string', label: 'DGG label text', default: 'dgg', placeholder: 'dgg', description: 'Text shown in the source badge for DGG messages.' },
          ],
        },
      ])
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { register }
  } else if (typeof window !== 'undefined') {
    window.omniScreenDggExtension = { register }
  }
})()
