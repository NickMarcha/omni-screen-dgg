/**
 * Destiny.gg extension for Omni Screen
 * This bundle is downloaded and stored locally when the user installs the extension.
 * Future: the app will load and call register(context) to integrate DGG chat, embeds, emotes, flairs.
 */
(function () {
  'use strict'
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { register: register }
  } else if (typeof window !== 'undefined') {
    window.omniScreenDggExtension = { register: register }
  }

  function register(context) {
    if (!context) return
    // Reserved for when the app supports runtime extension registration:
    // context.registerChatSource(...)
    // context.registerEmbedProvider(...)
    console.log('[omni-screen-dgg] Extension loaded. Runtime registration not yet supported by app.')
  }
})()
