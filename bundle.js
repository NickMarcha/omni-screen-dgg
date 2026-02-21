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

  // --- Mentions API (polecat.me) ---
  function fetchMentions(username, size, offset) {
    var url = 'https://polecat.me/api/mentions/' + encodeURIComponent(username) + '?size=' + size + '&offset=' + offset
    return fetch(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' }
    }).then(function (res) {
      if (!res.ok) return Promise.reject(new Error('HTTP ' + res.status))
      return res.json()
    }).then(function (data) {
      return { success: true, data: Array.isArray(data) ? data : [] }
    }).catch(function (err) {
      return { success: false, error: err && err.message ? err.message : String(err) }
    })
  }

  // --- Rustlesearch API (rustlesearch.dev) ---
  var RUSTLESEARCH_CHANNEL = 'Destinygg'
  var rustleLog = function (level, msg, args) {
    try { if (typeof console !== 'undefined' && console.log) console.log('[RustleSearch]', level, msg, args || []) } catch (e) {}
  }
  function fetchRustlesearch(filterTermsOrParams, searchAfter, size) {
    size = size || 150
    var isQueryMode = filterTermsOrParams && typeof filterTermsOrParams === 'object' && !Array.isArray(filterTermsOrParams)
    var terms = isQueryMode ? [] : (Array.isArray(filterTermsOrParams) ? filterTermsOrParams : [])
    var url = new URL('https://api-v2.rustlesearch.dev/anon/search')
    url.searchParams.set('channel', RUSTLESEARCH_CHANNEL)

    if (isQueryMode) {
      var p = filterTermsOrParams
      if (p.username && String(p.username).trim()) url.searchParams.set('username', String(p.username).trim())
      if (p.text && String(p.text).trim()) url.searchParams.set('text', String(p.text).trim())
      var today = new Date().toISOString().slice(0, 10)
      var defaultStart = '2017-01-01'
      url.searchParams.set('start_date', (p.start_date && String(p.start_date).trim()) || defaultStart)
      url.searchParams.set('end_date', (p.end_date && String(p.end_date).trim()) || today)
      if (p.search_after != null) url.searchParams.set('search_after', String(p.search_after))
    } else {
      var textParam = terms.map(function (t) { return String(t).trim() }).filter(Boolean).join('|')
      if (textParam) url.searchParams.set('text', textParam)
      if (searchAfter != null) url.searchParams.set('search_after', String(searchAfter))
    }

    var urlStr = url.toString()
    rustleLog('info', 'fetch URL', [urlStr])

    return fetch(urlStr, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' }
    }).then(function (res) {
      if (!res.ok) return res.text().then(function (body) {
        rustleLog('warn', 'search HTTP ' + res.status + ' body', [body])
        return Promise.reject(new Error('HTTP ' + res.status + ': ' + body))
      })
      return res.json()
    }).then(function (result) {
      if (result.type !== 'Success' || !result.data) {
        rustleLog('warn', 'search invalid response', [result.error || result.type, JSON.stringify(result).slice(0, 200)])
        return { success: false, error: result.error || 'Invalid response' }
      }
      var rawMessages = result.data.messages
      var messages = Array.isArray(rawMessages) ? rawMessages : (rawMessages ? Object.values(rawMessages) : [])
      var mappedData = messages.map(function (msg) {
        var date = new Date(msg.ts).getTime()
        return {
          id: date + '-' + (msg.username || ''),
          date: date,
          text: msg.text || '',
          nick: msg.username || '',
          flairs: '',
          matchedTerms: isQueryMode ? [] : terms,
          searchAfter: msg.searchAfter
        }
      })
      var lastSearchAfter
      if (messages.length > 0) {
        var lastMsg = messages[messages.length - 1]
        lastSearchAfter = lastMsg.searchAfter
        if (lastSearchAfter == null) {
          var sorted = mappedData.slice().sort(function (a, b) { return a.date - b.date })
          lastSearchAfter = sorted.length ? sorted[sorted.length - 1].date : undefined
        }
      }
      return {
        success: true,
        data: mappedData,
        searchAfter: lastSearchAfter,
        hasMore: messages.length > 0 && lastSearchAfter != null
      }
    }).catch(function (err) {
      rustleLog('warn', 'fetchRustlesearch catch', [err && err.message ? err.message : String(err)])
      return { success: false, error: err && err.message ? err.message : String(err) }
    })
  }

  function setRustleLog(logFn) {
    if (typeof logFn === 'function') rustleLog = logFn
  }

  function fetchRustlesearchSurrounds(username, datetime, channel) {
    channel = channel || RUSTLESEARCH_CHANNEL
    var url = new URL('https://api-v2.rustlesearch.dev/anon/surrounds')
    url.searchParams.set('username', String(username || ''))
    url.searchParams.set('channel', String(channel))
    url.searchParams.set('datetime', String(datetime || ''))
    return fetch(url.toString(), {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' }
    }).then(function (res) {
      if (!res.ok) return res.text().then(function (body) {
        return Promise.reject(new Error('HTTP ' + res.status + ': ' + body))
      })
      return res.json()
    }).then(function (result) {
      if (result.type !== 'Success' || !result.data) return { success: false, error: result.error || 'Invalid response' }
      var data = result.data
      var lines = Array.isArray(data.lines) ? data.lines : []
      var matched = data.matched || ''
      var lineRe = /^\[([^\]]+)\]\s+(\S+):\s*(.*)$/
      var messages = lines.map(function (line, idx) {
        var m = String(line).match(lineRe)
        var date = 0
        var nick = ''
        var text = ''
        if (m) {
          var tsStr = m[1].replace(' ', 'T').replace(' UTC', 'Z')
          date = new Date(tsStr).getTime()
          nick = m[2] || ''
          text = m[3] || ''
        }
        return {
          id: date + '-' + nick + '-' + idx,
          date: date,
          nick: nick,
          text: text,
          isMatched: String(line) === matched
        }
      })
      return {
        success: true,
        data: {
          messages: messages,
          matchedUsername: data.username || username || ''
        }
      }
    }).catch(function (err) {
      return { success: false, error: err && err.message ? err.message : String(err) }
    })
  }

  function onLiveMessage(message, api) {
    var type = message && message.type
    var payload = message && message.data
    api.sendToRenderer('live-websocket-message', message)
    if (type === 'dggApi:embeds' && Array.isArray(payload)) {
      api.sendToRenderer('live-websocket-embeds', payload)
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
    setRustleLog(function (level, msg, args) {
      try { log(level, '[RustleSearch] ' + msg, args || []) } catch (e) {}
    })
    try {
      if (typeof context.registerChatSource === 'function') {
        context.registerChatSource('dgg', {
        getConfig: function () {
          return DGG_CONFIG
        },
        onLiveMessage: onLiveMessage,
        getChatCommand: function (text) {
          var t = String(text || '').trim()
          if (t === '/die') return { cmd: 'DIE', payload: {} }
          if (t.indexOf('/die ') === 0) {
            var data = t.slice(5).trim()
            return { cmd: 'DIE', payload: data ? { data: data } : {} }
          }
          return null
        },
      })
    }
    if (typeof context.setRendererConfig === 'function') {
      context.setRendererConfig({
        menuTaglineTop: 'Vibed by StrawWaffle',
        menuTaglineBottom: 'Thanks to polecat.me, Rustlesearch, and Kickstiny for (unwittingly) tolerating my abuse of their APIs and scripts.',
        chatSources: {
          dgg: {
            baseUrl: DGG_CONFIG.baseUrl,
            loginUrl: DGG_CONFIG.loginUrl,
            emotesJsonUrl: DGG_CONFIG.emotesJsonUrl,
            emotesCssUrl: DGG_CONFIG.emotesCssUrl,
            flairsJsonUrl: DGG_CONFIG.flairsJsonUrl,
            flairsCssUrl: DGG_CONFIG.flairsCssUrl,
            platformIconUrl: DGG_CONFIG.baseUrl + '/favicon.ico',
            mentionsChannelLabel: 'Destinygg',
            pollsApiUrl: 'https://api.mitchdev.net/dgg/polls',
            pollsInfoUrl: 'https://mitchdev.net/dgg/',
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
    if (typeof context.registerChatSourceApi === 'function') {
      context.registerChatSourceApi('dgg', {
        fetchMentions: fetchMentions,
        fetchRustlesearch: fetchRustlesearch,
        fetchRustlesearchSurrounds: fetchRustlesearchSurrounds
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
