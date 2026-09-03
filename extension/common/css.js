/* Costum for YouTube — every hiding rule is plain CSS injected at
 * document_start. JavaScript hiding shows the element for a frame first;
 * CSS never does.
 *
 * Selectors are grouped by the YouTube page they act on, so a redesign of the
 * watch page takes out watch rules and leaves the rest working. A selector that
 * stops matching simply does nothing — it can never throw. */
(function (root) {
  'use strict';

  const AD_SELECTORS = [
    'ytd-display-ad-renderer',
    'ytd-promoted-sparkles-web-renderer',
    'ytd-promoted-video-renderer',
    'ytd-ad-slot-renderer',
    'ytd-in-feed-ad-layout-renderer',
    'ytd-banner-promo-renderer',
    'ytd-statement-banner-renderer',
    'ytd-companion-slot-renderer',
    'ytm-promoted-video-renderer',
    '#player-ads',
    '#masthead-ad',
    '.ytp-suggested-action',
    '.video-ads.ytp-ad-module'
  ];

  /* The fast path only: these are the tags we know today, injected as CSS at
   * document_start so nothing flashes. content/modules/shorts.js catches the
   * rest structurally, since YouTube renames these regularly. */
  const SHORTS_SELECTORS = [
    // shelves
    'ytd-reel-shelf-renderer',
    'ytd-rich-shelf-renderer[is-shorts]',
    'ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts])',
    'ytd-rich-section-renderer:has(ytm-shorts-lockup-view-model-v2)',
    // Confirmed against live desktop YouTube: the shelf is grid-shelf-view-model
    // wrapping ytm-* lockups — the mobile tag names, on the desktop site.
    'ytd-rich-section-renderer:has(grid-shelf-view-model)',
    'ytm-reel-shelf-renderer',
    'grid-shelf-view-model',
    // individual cards, old and new naming
    'ytd-video-renderer:has(a[href^="/shorts"])',
    'ytd-grid-video-renderer:has(a[href^="/shorts"])',
    'ytd-rich-item-renderer:has(a[href^="/shorts"])',
    'ytd-compact-video-renderer:has(a[href^="/shorts"])',
    'ytm-shorts-lockup-view-model',
    'ytm-shorts-lockup-view-model-v2',
    'shorts-lockup-view-model',
    'shorts-lockup-view-model-v2',
    // the way in: sidebar, mini sidebar, mobile bottom bar, chip bar
    'ytd-guide-entry-renderer:has(a[title="Shorts"])',
    'ytd-mini-guide-entry-renderer[aria-label="Shorts"]',
    'ytd-guide-entry-renderer:has(a[href="/shorts"])',
    'ytm-pivot-bar-item-renderer:has(a[href="/shorts"])',
    'ytm-pivot-bar-item-renderer:has(div[aria-label="Shorts"])',
    'yt-tab-shape[tab-title="Shorts"]'
  ];

  /* group → setting key → selectors */
  const DECLUTTER = {
    global: {
      popups: [
        'ytd-mealbar-promo-renderer',
        'yt-mealbar-promo-renderer',
        'ytd-inline-survey-renderer',
        'ytd-popup-container tp-yt-paper-dialog:has(ytd-consent-bump-v2-lightbox)',
        'tp-yt-paper-dialog:has(ytd-enforcement-message-view-model)',
        'ytd-button-renderer#dismiss-button ~ *'
      ],
      bannerAds: AD_SELECTORS,
      // Killing the continuation sentinel is what actually stops the endless feed.
      infiniteScroll: ['ytd-continuation-item-renderer', 'ytm-continuation-item-renderer'],
      notifications: ['ytd-notification-topbar-button-renderer'],
      merchShelf: ['ytd-merch-shelf-renderer', 'ytd-ticket-shelf-renderer', 'ytd-product-list-item-renderer']
    },

    watch: {
      comments: ['ytd-comments#comments', '#comments', 'ytd-item-section-renderer#comment-teaser', 'ytm-comments-entry-point-header-renderer'],
      related: ['#related', 'ytd-watch-next-secondary-results-renderer', 'ytm-item-section-renderer[section-identifier="related-items"]'],
      relatedCategories: ['#related ytd-shelf-renderer', '#related yt-related-chip-cloud-renderer', '#related ytd-chip-cloud-renderer'],
      liveChat: ['#chat', 'ytd-live-chat-frame', '#chat-container', '#teaser-carousel'],
      endScreens: ['.ytp-ce-element', '.html5-endscreen', '.ytp-endscreen-content', '.ytp-ce-covering-overlay'],
      infoCards: ['.ytp-cards-teaser', '.ytp-cards-button', '.iv-branding', '.ytp-cards-teaser-box'],
      playNext: ['.ytp-next-button', '.ytp-autonav-toggle-button-container'],
      moreFromChannel: [
        'ytd-watch-flexy ytd-horizontal-card-list-renderer',
        '#below ytd-shelf-renderer',
        'ytd-structured-description-content-renderer ytd-horizontal-card-list-renderer'
      ],
      shortsInDescription: [
        '#below ytd-reel-shelf-renderer',
        'ytd-structured-description-content-renderer ytd-reel-shelf-renderer'
      ],
      fundraiser: ['ytd-donation-shelf-renderer', '#donation-shelf', 'ytd-video-donation-shelf-renderer'],

      /* All verified against a live watch page. Two things had moved since the
       * names most guides use: related videos are `yt-lockup-view-model` now,
       * not `ytd-compact-video-renderer`, and a comment's timestamp is
       * `#published-time-text`, not `.published-time-text`. */
      actionBar: ['#top-level-buttons-computed'],
      subscribe: ['ytd-subscribe-button-renderer'],
      join: ['#sponsor-button'],
      likeDislike: ['segmented-like-dislike-button-view-model'],
      videoTitle: ['ytd-watch-metadata h1'],
      channelInfo: ['ytd-video-owner-renderer'],
      subscriberCount: ['#owner-sub-count'],
      viewsAndDate: ['ytd-watch-info-text'],
      description: ['#description', 'ytd-text-inline-expander'],
      commentsCount: ['ytd-comments-header-renderer #count'],
      commentsSort: ['ytd-comments-header-renderer #sort-menu'],
      commentAvatar: ['ytd-comment-view-model #author-thumbnail'],
      commentAuthor: ['ytd-comment-view-model #author-text'],
      commentTime: ['ytd-comment-view-model #published-time-text'],
      commentVotes: ['ytd-comment-view-model #vote-count-middle'],
      commentReply: ['ytd-comment-view-model #reply-button-end'],
      commentReplies: ['ytd-comment-replies-renderer'],
      playButton: ['.ytp-play-button'],
      volumeButton: ['.ytp-mute-button', '.ytp-volume-panel'],
      captionsButton: ['.ytp-subtitles-button'],
      settingsButton: ['.ytp-settings-button'],
      theaterButton: ['.ytp-size-button'],
      fullscreenButton: ['.ytp-fullscreen-button'],
      autoplayToggle: ['.ytp-autonav-toggle-button-container'],
      chaptersButton: ['.ytp-chapter-container'],
      gradientBottom: ['.ytp-gradient-bottom'],
      gradientTop: ['.ytp-gradient-top'],
      videoTime: ['.ytp-time-display'],
      heatmap: ['.ytp-heat-map-container'],
      paidPromotion: ['.ytp-paid-content-overlay']
    },

    home: {
      feed: ['ytd-browse[page-subtype="home"] ytd-rich-grid-renderer', 'ytd-browse[page-subtype="home"] #contents'],
      chips: ['ytd-browse[page-subtype="home"] #chips-wrapper', 'ytd-feed-filter-chip-bar-renderer', 'ytd-browse[page-subtype="home"] #header'],
      // Mixes are radio playlists; their links always carry a list=RD… id.
      mixes: [
        'ytd-rich-item-renderer:has(a[href*="list=RD"])',
        'yt-lockup-view-model:has(a[href*="list=RD"])',
        'ytd-radio-renderer', 'ytd-compact-radio-renderer'
      ],
      playlists: ['ytd-rich-item-renderer:has(ytd-playlist-thumbnail)', 'ytd-playlist-renderer', 'ytd-compact-playlist-renderer'],
      // The editorial shelves YouTube injects into the feed: breaking news,
      // trending, "creators for you" and the rest.
      news: [
        'ytd-rich-section-renderer:has(ytd-shelf-renderer)',
        'ytd-rich-section-renderer:has(ytd-horizontal-card-list-renderer)',
        'ytm-rich-section-renderer:has(ytm-shelf-renderer)'
      ],
      banners: [
        'ytd-statement-banner-renderer',
        'ytd-banner-promo-renderer',
        'ytd-brand-video-shelf-renderer',
        'ytd-inline-survey-renderer',
        'yt-survey-renderer',
        'ytd-rich-section-renderer:has(ytd-statement-banner-renderer)'
      ]
    },

    /* Every rule that can be scoped to the results page is, because most of
     * these element names are not search's own. `ytd-shelf-renderer` is also
     * the channel page's shelves and the watch page's "more from channel";
     * `ytd-playlist-renderer` and `ytd-radio-renderer` are also the home feed's
     * playlists and mixes; `ytd-feed-filter-chip-bar-renderer` is *only* ever
     * the home chip bar and never appears on a results page at all. Unscoped,
     * a switch in the Search tab quietly emptied three other pages — which is
     * the one thing grouping by page exists to prevent.
     *
     * Checked on a live results page: every element below that renders at all
     * renders inside `ytd-search`. Results do not live in `ytd-browse`, which
     * the sidebar rule had already been corrected for once.
     *
     * The two suggestion rules stay unscoped on purpose: that dropdown belongs
     * to the header search box, which is not inside `ytd-search` on any page. */
    search: {
      // `ytd-searchbox` was retired; these are the current class names.
      suggestions: [
        '.ytSearchboxComponentSuggestionsContainer',
        '#search-suggestions-container',
        'ytd-search-suggestion-renderer'
      ],
      previousSearches: [
        '.ytSuggestionComponentSuggestion:has(.ytIconWrapperHost)',
        'ytd-search-suggestion-renderer:has(yt-icon#history-icon)'
      ],
      chips: ['ytd-search yt-chip-cloud-renderer', 'ytd-search ytd-feed-filter-chip-bar-renderer'],
      filters: ['ytd-search ytd-search-sub-menu-renderer', 'ytd-search #filter-button'],
      aboutResults: ['ytd-search ytd-search-header-renderer'],
      peopleAlsoSearch: ['ytd-search ytd-horizontal-card-list-renderer:has(ytd-search-refinement-card-renderer)'],
      promotedVideos: ['ytd-search ytd-promoted-video-renderer', 'ytd-search ytd-ad-slot-renderer'],
      promotedWebsites: ['ytd-search ytd-search-pyv-renderer'],
      shelves: ['ytd-search ytd-shelf-renderer', 'ytd-search grid-shelf-view-model'],
      channels: ['ytd-search ytd-channel-renderer'],
      playlists: ['ytd-search ytd-playlist-renderer', 'ytd-search ytd-radio-renderer'],
      rightSidebar: ['ytd-search #secondary', 'ytd-two-column-search-results-renderer #secondary'],
      infiniteScroll: ['ytd-search ytd-continuation-item-renderer']
    },

    /* Verified against live YouTube on 30 Aug 2026. Two things had already
     * moved: `ytd-searchbox` no longer exists (it is `yt-searchbox` now, and the
     * suggestion list is plain classes), and the logo is an icon inside
     * `ytd-logo` rather than markup we can pick apart. */
    shortsPlayer: {
      overlay: ['ytd-reel-player-overlay-renderer'],
      title: ['yt-shorts-video-title-view-model'],
      channelBar: ['yt-reel-channel-bar-view-model'],
      avatar: ['yt-reel-channel-bar-view-model img'],
      actions: ['ytd-reel-video-renderer #actions'],
      navButtons: ['#navigation-button-down', '#navigation-button-up'],
      subscribe: ['ytd-reel-video-renderer ytd-subscribe-button-renderer'],
      description: ['ytd-reel-video-renderer #description'],
      menu: ['ytd-reel-video-renderer #menu']
    },

    cards: {
      title: ['ytd-video-renderer #video-title, ytd-rich-item-renderer #video-title, ytd-grid-video-renderer #video-title, yt-lockup-view-model #video-title, ytd-compact-video-renderer #video-title'],
      channelAvatar: ['ytd-channel-thumbnail-with-link-renderer', '#channel-thumbnail'],
      channelName: ['ytd-video-renderer ytd-channel-name', 'ytd-rich-item-renderer ytd-channel-name'],
      meta: ['#metadata-line'],
      duration: ['ytd-thumbnail-overlay-time-status-renderer'],
      menu: ['ytd-video-renderer #menu', 'ytd-rich-item-renderer #menu'],
      snippet: ['.metadata-snippet-text', '#description-text'],
      badges: ['ytd-badge-supported-renderer'],
      progress: ['#progress', 'ytd-thumbnail-overlay-resume-playback-renderer']
    },

    subscriptions: {
      watched: ['ytd-browse[page-subtype="subscriptions"] ytd-rich-item-renderer:has(#progress)'],
      livePremiere: ['ytd-browse[page-subtype="subscriptions"] ytd-rich-item-renderer:has(.badge-style-type-live-now-alternate)'],
      upcoming: ['ytd-browse[page-subtype="subscriptions"] ytd-rich-item-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="UPCOMING"])'],
      shorts: ['ytd-browse[page-subtype="subscriptions"] grid-shelf-view-model']
    },

    header: {
      hideAll: ['#masthead-container', 'ytd-masthead'],
      logo: ['ytd-topbar-logo-renderer'],

      countryCode: ['#country-code'],
      searchBar: ['ytd-masthead #center', 'yt-searchbox'],
      searchSuggestions: ['.ytSearchboxComponentSuggestionsContainer'],
      previousSearches: ['.ytSuggestionComponentSuggestion:has(.ytIconWrapperHost)'],
      voiceSearch: ['#voice-search-button'],
      create: ['ytd-masthead ytd-topbar-menu-button-renderer'],
      notifications: ['ytd-notification-topbar-button-renderer'],
      notificationsCount: [
        'ytd-notification-topbar-button-renderer .yt-spec-icon-badge-shape__badge',
        'ytd-notification-topbar-button-renderer .yt-spec-icon-badge-shape'
      ],
      signIn: ['ytd-masthead a[href*="accounts.google.com"]', 'ytd-masthead a[href*="ServiceLogin"]'],
      avatar: ['#avatar-btn', 'ytd-masthead #avatar-btn']
    },

    sidebar: {
      hideAll: ['tp-yt-app-drawer#guide', 'ytd-mini-guide-renderer', '#guide'],
      burger: ['#guide-button', 'ytd-masthead #guide-button'],
      icons: ['ytd-guide-entry-renderer yt-icon', 'ytd-mini-guide-entry-renderer yt-icon'],
      home: ['ytd-guide-entry-renderer:has(a[href="/"])', 'ytd-mini-guide-entry-renderer:has(a[href="/"])'],
      shortsButton: [
        'ytd-guide-entry-renderer:has(a[title="Shorts"])',
        'ytd-mini-guide-entry-renderer[aria-label="Shorts"]',
        'ytd-guide-entry-renderer:has(a[href="/shorts"])'
      ],
      subscriptionsButton: ['ytd-guide-entry-renderer:has(a[href="/feed/subscriptions"])', 'ytd-mini-guide-entry-renderer:has(a[href="/feed/subscriptions"])'],
      music: ['ytd-guide-entry-renderer:has(a[href*="music.youtube.com"])', 'ytd-mini-guide-entry-renderer:has(a[href*="music.youtube.com"])'],
      kids: ['ytd-guide-entry-renderer:has(a[href*="youtubekids.com"])', 'ytd-mini-guide-entry-renderer:has(a[href*="youtubekids.com"])'],
      you: ['ytd-guide-entry-renderer:has(a[href="/feed/you"])', 'ytd-mini-guide-entry-renderer:has(a[href="/feed/you"])'],
      history: ['ytd-guide-entry-renderer:has(a[href="/feed/history"])', 'ytd-mini-guide-entry-renderer:has(a[href="/feed/history"])'],
      playlists: ['ytd-guide-entry-renderer:has(a[href="/feed/playlists"])', 'ytd-mini-guide-entry-renderer:has(a[href="/feed/playlists"])'],
      yourVideos: ['ytd-guide-entry-renderer:has(a[href*="studio.youtube.com"])', 'ytd-mini-guide-entry-renderer:has(a[href*="studio.youtube.com"])'],
      watchLater: ['ytd-guide-entry-renderer:has(a[href*="list=WL"])', 'ytd-mini-guide-entry-renderer:has(a[href*="list=WL"])'],
      liked: ['ytd-guide-entry-renderer:has(a[href*="list=LL"])', 'ytd-mini-guide-entry-renderer:has(a[href*="list=LL"])'],
      downloads: ['ytd-guide-entry-renderer:has(a[href="/feed/downloads"])', 'ytd-mini-guide-entry-renderer:has(a[href="/feed/downloads"])'],
      clips: ['ytd-guide-entry-renderer:has(a[href="/feed/clips"])', 'ytd-mini-guide-entry-renderer:has(a[href="/feed/clips"])'],
      trending: ['ytd-guide-entry-renderer:has(a[href="/feed/trending"])', 'ytd-mini-guide-entry-renderer:has(a[href="/feed/trending"])'],
      movies: ['ytd-guide-entry-renderer:has(a[href="/feed/storefront"])', 'ytd-mini-guide-entry-renderer:has(a[href="/feed/storefront"])'],
      gaming: ['ytd-guide-entry-renderer:has(a[href="/gaming"])', 'ytd-mini-guide-entry-renderer:has(a[href="/gaming"])'],
      podcasts: ['ytd-guide-entry-renderer:has(a[href="/podcasts"])', 'ytd-mini-guide-entry-renderer:has(a[href="/podcasts"])'],
      premium: ['ytd-guide-entry-renderer:has(a[href="/premium"])', 'ytd-mini-guide-entry-renderer:has(a[href="/premium"])'],
      settingsEntry: ['ytd-guide-entry-renderer:has(a[href="/account"])', 'ytd-mini-guide-entry-renderer:has(a[href="/account"])'],
      reportHistory: ['ytd-guide-entry-renderer:has(a[href="/reporthistory"])', 'ytd-mini-guide-entry-renderer:has(a[href="/reporthistory"])'],
      help: ['ytd-guide-entry-renderer:has(a[href*="support.google.com"])', 'ytd-mini-guide-entry-renderer:has(a[href*="support.google.com"])'],
      feedback: ['ytd-guide-entry-renderer:has(a[href*="#feedback"])', 'ytd-mini-guide-entry-renderer:has(a[href*="#feedback"])'],
      explore: ['ytd-guide-section-renderer:has(a[href="/feed/trending"])', 'ytd-guide-section-renderer:has(a[href="/gaming"])'],
      subscriptions: ['ytd-guide-section-renderer:has(#expandable-items)', 'ytd-guide-collapsible-entry-renderer'],
      moreFromYouTube: ['ytd-guide-section-renderer:has(a[href="/premium"])', 'ytd-guide-section-renderer:has(a[href^="https://www.youtube.com/premium"])'],
      signIn: ['ytd-guide-signin-promo-renderer', '#guide ytd-button-renderer:has(a[href*="accounts.google.com"])'],
      footer: ['ytd-guide-renderer #footer', 'tp-yt-app-drawer#guide #footer'],
      subAvatars: ['ytd-guide-entry-renderer #guide-icon img', 'ytd-guide-entry-renderer yt-img-shadow img'],
      subDots: ['ytd-guide-entry-renderer .guide-entry-count', 'ytd-guide-entry-renderer #newness-dot'],
      showMore: ['ytd-guide-collapsible-item-renderer #expander-item']
    },

    /* The "You" page. CSS cannot match a shelf by its heading text, but each
     * shelf carries a link that names it — history, WL, LL and so on — which is
     * both matchable and stable across interface languages. */
    library: {
      avatar: [
        'ytd-browse[page-subtype="library"] ytd-active-account-header-renderer',
        'ytm-profile-header-renderer',
        'ytd-browse[page-subtype="library"] #avatar'
      ],
      history: ['ytd-browse[page-subtype="library"] ytd-item-section-renderer:has(a[href="/feed/history"])'],
      watchLater: ['ytd-browse[page-subtype="library"] ytd-item-section-renderer:has(a[href*="list=WL"])'],
      playlists: ['ytd-browse[page-subtype="library"] ytd-item-section-renderer:has(a[href="/feed/playlists"])'],
      likedVideos: ['ytd-browse[page-subtype="library"] ytd-item-section-renderer:has(a[href*="list=LL"])'],
      clips: ['ytd-browse[page-subtype="library"] ytd-item-section-renderer:has(a[href="/feed/clips"])']
    },

    /* Channel tabs expose their name on tab-title. That attribute follows the
     * interface language, so these rules are matched in English and Arabic. */
    channel: {
      hideBanner: ['#banner', 'yt-image-banner-view-model'],
      avatar: ['yt-page-header-renderer yt-avatar-shape'],
      name: ['yt-page-header-renderer h1'],
      metadata: ['yt-content-metadata-view-model'],
      tagline: ['yt-description-preview-view-model'],
      links: ['yt-page-header-renderer a[href^="http"]'],
      subscribe: ['yt-flexible-actions-view-model button-view-model:has(.ytSpecButtonShapeNextFilled)'],
      join: ['yt-flexible-actions-view-model button-view-model:has(.ytSpecButtonShapeNextTonal)'],
      tabBar: ['yt-tab-group-shape', 'yt-page-header-renderer tp-yt-paper-tabs'],
      tabHome: ['yt-tab-shape[tab-title="Home"]', 'yt-tab-shape[tab-title="الرئيسية"]'],
      tabVideos: ['yt-tab-shape[tab-title="Videos"]', 'yt-tab-shape[tab-title="الفيديوهات"]'],
      tabShows: ['yt-tab-shape[tab-title="Shows"]', 'yt-tab-shape[tab-title="Releases"]'],
      tabPlaylists: ['yt-tab-shape[tab-title="Playlists"]', 'yt-tab-shape[tab-title="قوائم التشغيل"]'],
      featured: ['ytd-channel-video-player-renderer'],
      shelves: ['ytd-browse[page-subtype="channels"] ytd-shelf-renderer'],
      shortsShelf: ['ytd-browse[page-subtype="channels"] grid-shelf-view-model', 'ytd-browse[page-subtype="channels"] ytd-reel-shelf-renderer'],
      podcasts: ['yt-tab-shape[tab-title="Podcasts"]', 'yt-tab-shape[tab-title="بودكاست"]'],
      community: ['yt-tab-shape[tab-title="Posts"]', 'yt-tab-shape[tab-title="Community"]', 'yt-tab-shape[tab-title="المنشورات"]'],
      live: ['yt-tab-shape[tab-title="Live"]', 'yt-tab-shape[tab-title="بث مباشر"]'],
      shortsTab: ['yt-tab-shape[tab-title="Shorts"]'],
      store: ['yt-tab-shape[tab-title="Store"]', 'yt-tab-shape[tab-title="المتجر"]'],
      liveSection: ['ytd-browse[page-subtype="channels"] ytd-shelf-renderer:has(a[href*="/streams"])'],
      shortsSection: ['ytd-browse[page-subtype="channels"] ytd-reel-shelf-renderer']
    }
  };

  /* Which group belongs to which page — the panel uses this to show the
   * controls for the page you are actually looking at. */
  const PAGE_OF = {
    header: () => true,
    shortsPlayer: (path) => path.startsWith('/shorts'),
    cards: () => true,
    subscriptions: (path) => path.startsWith('/feed/subscriptions'),
    watch: (path) => path.startsWith('/watch'),
    home: (path) => path === '/' || path === '',
    search: (path) => path.startsWith('/results'),
    channel: (path) => /^\/(@|channel\/|c\/|user\/)/.test(path),
    library: (path) => path.startsWith('/feed/you') || path.startsWith('/feed/library') || path.startsWith('/feed/history'),
    sidebar: () => true,
    global: () => true
  };

  /* Not every switch hides something. These are handled as style rules in
   * buildLayoutCss, and are listed here so the "every setting has a rule behind
   * it" test can tell them apart from a setting somebody forgot to wire up. */
  const STYLE_ONLY = {
    channel: ['grayscaleBanner', 'grayscaleAvatar'],
    cards: ['hoverPlay', 'cornerRadius', 'grayscaleAvatar'],
    header: ['logoWord', 'logoLink'],
    layout: ['homeColumns', 'homeRows']
  };

  const THUMB_SELECTOR = 'ytd-thumbnail img, ytd-playlist-thumbnail img, yt-image img, .ytp-videowall-still-image, ytm-thumbnail-cover img';

  /* Wider than THUMB_SELECTOR: a modesty filter that covered thumbnails but
     left avatars, channel banners and the end-screen stills showing would miss
     most of what it is for. */
  const PERSON_IMAGE_SELECTOR = [
    THUMB_SELECTOR,
    '#avatar img', 'yt-img-shadow img', 'ytd-channel-avatar img',
    'yt-decorated-avatar-view-model img', 'ytd-c4-tabbed-header-renderer img',
    '#channel-header img', 'tp-yt-app-header img', 'ytd-backstage-image-renderer img',
    'ytd-comment-view-model #author-thumbnail img', '.yt-core-image'
  ].join(', ');

  function hide(list) {
    return list.join(',\n') + ' { display: none !important; }';
  }

  function buildDeclutterCss(s) {
    const d = s.declutter;
    const out = [];

    if (d.shorts === 'hide') out.push(hide(SHORTS_SELECTORS));

    for (const group of Object.keys(DECLUTTER)) {
      const settings = d[group] || {};
      for (const key of Object.keys(DECLUTTER[group])) {
        const selectors = DECLUTTER[group][key];
        // An empty list would emit a rule with no selector, which is silently
        // dropped by the parser and impossible to notice.
        if (settings[key] && selectors.length) out.push(hide(selectors));
      }
    }

    if (d.thumbnails === 'hide') {
      out.push(THUMB_SELECTOR + ' { visibility: hidden !important; }');
    } else if (d.thumbnails === 'grayscale') {
      out.push(THUMB_SELECTOR + ' { filter: grayscale(1) !important; }');
    } else if (d.thumbnails === 'blur') {
      out.push(THUMB_SELECTOR + ' { filter: blur(14px) !important; transition: filter .18s ease; }');
      out.push('ytd-thumbnail:hover img, ytd-rich-item-renderer:hover img { filter: none !important; }');
    }

    if (s.block.hideWatched) {
      /* "Watched" is a progress bar that is nearly full. The test for it was
         `[style*="width: 9"]`, which matches `width: 90%` through `width: 99%`
         — and also `width: 9%`, so a video someone had barely started
         disappeared along with the ones they had finished. Each tenth is named
         instead; a substring cannot express a numeric range. */
      const nearlyDone = [];
      for (let pct = 90; pct <= 100; pct++) nearlyDone.push('[style*="width: ' + pct + '"]');
      const rows = ['ytd-rich-item-renderer', 'ytd-video-renderer'];
      const selectors = [];
      rows.forEach((row) => nearlyDone.forEach((mark) => selectors.push(row + ':has(#progress' + mark + ')')));
      out.push(hide(selectors));
    }

    return out.join('\n\n');
  }

  /* Kept out of buildDeclutterCss so it can be reasoned about and tested on its
     own: this is the one feature where getting it wrong means someone sees
     something they switched the extension on to avoid. */
  function buildModestyCss(s) {
    const m = s.modesty || {};
    const out = [];
    const px = Math.max(4, Math.min(40, Number(m.strength) || 16));

    if (m.images === 'hide') {
      out.push(PERSON_IMAGE_SELECTOR + ' { visibility: hidden !important; }');
    } else if (m.images === 'blur') {
      out.push(PERSON_IMAGE_SELECTOR + ' { filter: blur(' + px + 'px) !important; }');
      // Clip to the image's own box, or the blur bleeds past its edges and the
      // covering is thinner at the boundary than in the middle.
      out.push('ytd-thumbnail, yt-image, #avatar, yt-img-shadow { overflow: hidden !important; }');
      if (m.reveal === 'hover') {
        out.push([
          'ytd-thumbnail:hover img', 'ytd-rich-item-renderer:hover img',
          'ytd-video-renderer:hover img', 'yt-image:hover img'
        ].join(',\n') + ' { filter: none !important; }');
      }
    }

    /* The video itself. 'audio' is not a heavier blur — it is an opaque cover,
       because a blurred moving picture still reads as a moving picture. */
    if (m.video === 'audio') {
      out.push('.html5-video-container, .ytp-cued-thumbnail-overlay-image { background: #000 !important; }');
      out.push('video.html5-main-video { opacity: 0 !important; }');
    }

    return out.join('\n\n');
  }

  function buildLayoutCss(s) {
    const l = s.layout;
    const out = [];

    // Shorts is a swipe feed; taking the scroll away is what ends the session.
    if (s.declutter.shortsScroll === false) {
      out.push([
        'ytd-shorts, ytd-reel-video-renderer, #shorts-container,',
        'ytm-shorts-player, .reel-video-in-sequence {',
        '  overflow: hidden !important;',
        '  touch-action: none !important;',
        '  overscroll-behavior: none !important;',
        '}',
        'ytd-shorts #navigation-button-down, ytd-shorts #navigation-button-up { display: none !important; }'
      ].join('\n'));
    }

    if (l.widePlayer) {
      out.push([
        'ytd-watch-flexy[theater] #player-theater-container,',
        'ytd-watch-flexy:not([theater]) #primary.ytd-watch-flexy {',
        '  max-width: none !important;',
        '}',
        'ytd-watch-flexy:not([theater]) #player-container-outer { max-width: none !important; }'
      ].join('\n'));
    }

    if (l.fitToWindow) {
      out.push([
        'ytd-watch-flexy[theater] #player-theater-container {',
        '  height: calc(100vh - 56px) !important;',
        '  max-height: none !important;',
        '}'
      ].join('\n'));
    }

    /* A font swap needs no YouTube-specific hook, so it is the one part of
     * "appearance" that can be shipped honestly. Recolouring would need
     * YouTube's own theme variables, which are scoped inside Polymer styles
     * this extension cannot read — a guess there recolours half the page. */
    /* Last, so it wins against everything the switches produced. Two hundred
     * and thirty-one settings still will not cover every page YouTube ships,
     * and a text box costs nothing to carry. Idea borrowed from Minimal Theme
     * for Twitter (MIT), which puts the same escape hatch under Advanced. */
    if (s.declutter.customCss && s.declutter.customCss.trim()) {
      out.push('/* custom */\n' + s.declutter.customCss.trim());
    }

    if (s.declutter.font) {
      out.push('ytd-app, ytd-app *, ytm-app, ytm-app * { font-family: ' + s.declutter.font + ' !important; }');
    }

    const channel = s.declutter.channel;
    if (channel.grayscaleBanner) out.push('#banner img, yt-image-banner-view-model img { filter: grayscale(1) !important; }');
    if (channel.grayscaleAvatar) out.push('yt-page-header-renderer yt-avatar-shape img { filter: grayscale(1) !important; }');

    const cards = s.declutter.cards;
    if (cards.hoverPlay) {
      out.push('ytd-video-preview, #video-preview, ytd-moving-thumbnail-renderer { display: none !important; }');
    }
    if (cards.cornerRadius) {
      out.push('ytd-thumbnail, ytd-thumbnail img, yt-thumbnail-view-model img { border-radius: 0 !important; }');
    }
    if (cards.grayscaleAvatar) {
      out.push('ytd-channel-thumbnail-with-link-renderer img, #channel-thumbnail img { filter: grayscale(1) !important; }');
    }

    const header = s.declutter.header;
    if (header.logoWord) {
      // The wordmark is baked into one icon, so it gets clipped rather than
      // hidden — what survives is the play button on its own.
      out.push('ytd-logo { width: 30px !important; overflow: hidden !important; }');
    }
    if (header.logoLink) {
      out.push('ytd-topbar-logo-renderer a { pointer-events: none !important; cursor: default !important; }');
    }

    if (l.homeColumns > 0) {
      // YouTube sizes its own grid from this variable, so setting it keeps the
      // layout consistent instead of fighting it with widths.
      out.push([
        'ytd-rich-grid-renderer {',
        '  --ytd-rich-grid-items-per-row: ' + l.homeColumns + ' !important;',
        '  --ytd-rich-grid-posts-per-row: ' + l.homeColumns + ' !important;',
        '}'
      ].join('\n'));
    }

    /* The player pinned to a corner once you have scrolled past it.
     * layout.js has always set `costum-mini` on <html> and no stylesheet has
     * ever read it, so the switch measured the scroll position and then did
     * nothing whatsoever.
     *
     * `#player` is what holds the column open once its child leaves the flow —
     * confirmed live as the parent of `#player-container-outer`. Without that,
     * pinning collapses the column, the page scrolls up, the player comes back
     * into view and it un-pins on the next frame. */
    if (l.miniOnScroll) {
      out.push([
        'html[costum-mini] ytd-watch-flexy #player {',
        '  min-height: var(--costum-mini-hold, 0px) !important;',
        '}',
        'html[costum-mini] #player-container-outer,',
        'html[costum-mini] #player-theater-container {',
        '  position: fixed !important;',
        '  inset-block-end: 16px; inset-inline-end: 16px;',
        '  width: clamp(200px, 38vw, 400px) !important;',
        '  height: auto !important;',
        '  z-index: 2147482000 !important;',
        '  border-radius: 12px;',
        '  overflow: hidden;',
        '  box-shadow: 0 12px 40px rgba(0,0,0,.5);',
        '}'
      ].join('\n'));
    }

    if (l.hideScrollbar) {
      out.push('html { scrollbar-width: none !important; }\nhtml::-webkit-scrollbar { display: none !important; }');
    }

    if (s.playback.nativePlayer) {
      out.push([
        'html[costum-native] video.html5-main-video { display: none !important; }',
        'html[costum-native] .ytp-chrome-top, html[costum-native] .ytp-chrome-bottom,',
        'html[costum-native] .ytp-gradient-top, html[costum-native] .ytp-gradient-bottom { display: none !important; }'
      ].join('\n'));
    }

    /* One switch for one task, the way Minimal Theme for Twitter (MIT) does it
     * with Zen Writer Mode: instead of asking someone to find six switches, the
     * mode composes them. Every selector here was seen matching on a live watch
     * page — the header, both sidebars, the related column and everything
     * below the player. */
    if (l.zen) {
      out.push([
        'html[costum-zen] #masthead-container,',
        'html[costum-zen] ytd-mini-guide-renderer,',
        'html[costum-zen] tp-yt-app-drawer#guide,',
        'html[costum-zen] ytd-watch-flexy #secondary,',
        'html[costum-zen] ytd-watch-flexy #below { display: none !important; }',
        '',
        'html[costum-zen] ytd-app { --ytd-masthead-height: 0px !important; }',
        'html[costum-zen] #page-manager { margin-top: 0 !important; }',
        'html[costum-zen] ytd-watch-flexy #columns,',
        'html[costum-zen] ytd-watch-flexy #primary,',
        'html[costum-zen] ytd-watch-flexy #primary-inner,',
        'html[costum-zen] #player-container-outer {',
        '  max-width: none !important; margin: 0 !important; padding: 0 !important;',
        '}',
        'html[costum-zen] ytd-watch-flexy #player-container-inner { padding-top: 0 !important; }',
        'html[costum-zen] ytd-watch-flexy video { max-height: 100vh !important; }'
      ].join('\n'));
    }

    if (l.cinema) {
      const alpha = Math.max(0, Math.min(95, l.cinemaDim)) / 100;
      out.push([
        'html[costum-cinema] ytd-app { background: #000 !important; }',
        'html[costum-cinema] #masthead-container,',
        'html[costum-cinema] #secondary,',
        'html[costum-cinema] #below {',
        '  opacity: ' + (1 - alpha).toFixed(2) + ' !important;',
        '  transition: opacity .25s ease;',
        '}',
        'html[costum-cinema] #masthead-container:hover,',
        'html[costum-cinema] #secondary:hover,',
        'html[costum-cinema] #below:hover { opacity: 1 !important; }'
      ].join('\n'));
    }

    return out.join('\n\n');
  }

  function currentPages(path) {
    return Object.keys(PAGE_OF).filter((group) => PAGE_OF[group](path));
  }

  root.CostumCss = {
    DECLUTTER, SHORTS_SELECTORS, PAGE_OF, STYLE_ONLY,
    buildDeclutterCss, buildLayoutCss, buildModestyCss, currentPages
  ,PERSON_IMAGE_SELECTOR
  };
})(typeof self !== 'undefined' ? self : this);
