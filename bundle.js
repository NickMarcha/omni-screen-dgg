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

  function makeEmbedKey(platform, id) {
    var p = String(platform || '').toLowerCase()
    var rawId = String(id || '')
    var idNorm = p === 'youtube' ? rawId : rawId.toLowerCase()
    return p + ':' + idNorm
  }

  function onLiveMessage(message, api) {
    var type = message && message.type
    var payload = message && message.data
    api.sendToRenderer('live-websocket-message', message)
    if (type === 'dggApi:embeds' && Array.isArray(payload)) {
      var keys = []
      var byKey = {}
      for (var i = 0; i < payload.length; i++) {
        var embed = payload[i]
        if (embed && embed.platform && embed.id) {
          var key = makeEmbedKey(embed.platform, embed.id)
          keys.push(key)
          var displayName = embed.mediaItem && embed.mediaItem.metadata && embed.mediaItem.metadata.displayName
          if (displayName) byKey[key] = { displayName: displayName }
        }
      }
      api.setLiveEmbeds(keys, byKey)
    }
    if (type === 'dggApi:hosting') api.sendToRenderer('live-websocket-hosting', payload)
    else if (type === 'dggApi:youtubeVods') api.sendToRenderer('live-websocket-youtube-vods', payload)
    else if (type === 'dggApi:videos') api.sendToRenderer('live-websocket-videos', payload)
    else if (type === 'dggApi:streamInfo') api.sendToRenderer('live-websocket-stream-info', payload)
    else if (type === 'dggApi:events') api.sendToRenderer('live-websocket-events', payload)
    else if (type === 'dggApi:bannedEmbeds') api.sendToRenderer('live-websocket-banned-embeds', payload)
  }

  function register(context) {
    if (!context) return
    var log = typeof context.log === 'function' ? context.log.bind(context) : function (level, msg) { console.log('[' + level + ']', msg) }
    try {
      if (typeof context.registerChatSource === 'function') {
        context.registerChatSource('dgg', {
        getConfig: function () {
          return DGG_CONFIG
        },
        onLiveMessage: onLiveMessage,
      })
    }
    if (typeof context.setRendererConfig === 'function') {
      context.setRendererConfig({
        chatSources: {
          dgg: {
            baseUrl: DGG_CONFIG.baseUrl,
            loginUrl: DGG_CONFIG.loginUrl,
            emotesJsonUrl: DGG_CONFIG.emotesJsonUrl,
            emotesCssUrl: DGG_CONFIG.emotesCssUrl,
            flairsJsonUrl: DGG_CONFIG.flairsJsonUrl,
            flairsCssUrl: DGG_CONFIG.flairsCssUrl,
            platformIconUrl: DGG_CONFIG.baseUrl + '/favicon.ico',
          },
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
            { key: 'flairsAndColors', type: 'boolean', label: 'DGG flairs and colors', default: true, description: 'When off, DGG nicks use a single color and no flair icons.' },
            { key: 'labelColor', type: 'string', label: 'DGG label color', default: '', placeholder: '#ffffff', description: 'Badge color in combined chat. Clear = theme default.' },
            { key: 'labelText', type: 'string', label: 'DGG label text', default: 'dgg', placeholder: 'dgg', description: 'Text shown in the source badge for DGG messages.' },
          ],
        },
      ])
    }
      log('info', 'DGG chat source registered')
    } catch (e) {
      log('error', 'DGG extension failed to register: ' + (e && e.message ? e.message : String(e)), e)
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { register }
  } else if (typeof window !== 'undefined') {
    window.omniScreenDggExtension = { register }
  }
})()
