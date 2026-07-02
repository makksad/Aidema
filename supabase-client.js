(function () {
  "use strict";

  let client = null;

  function getConfig() {
    return window.AIDEMA_SUPABASE_CONFIG || {};
  }

  function isConfigured() {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = getConfig();
    return /^https:\/\/.+\.supabase\.co\/?$/i.test(String(SUPABASE_URL || "").trim())
      && String(SUPABASE_ANON_KEY || "").trim().length > 20;
  }

  function getConfigurationError() {
    if (!isConfigured()) {
      return "Supabase не настроен. Заполните SUPABASE_URL и SUPABASE_ANON_KEY в supabase-config.js.";
    }
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      return "Не удалось загрузить библиотеку supabase-js.";
    }
    return "";
  }

  function getClient() {
    if (client) return client;
    if (getConfigurationError()) return null;

    const { SUPABASE_URL, SUPABASE_ANON_KEY } = getConfig();
    client = window.supabase.createClient(
      String(SUPABASE_URL).trim(),
      String(SUPABASE_ANON_KEY).trim(),
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );
    return client;
  }

  window.AIDEMA_SUPABASE = Object.freeze({
    getClient,
    getConfig,
    getConfigurationError,
    isConfigured
  });
})();
