export const FEEDS = [
  {
    id: "aitimes",
    name: "AI타임스",
    url: "https://www.aitimes.com/rss/allArticle.xml",
    category: "AI",
  },
  {
    id: "openai",
    name: "OpenAI",
    url: "https://openai.com/news/rss.xml",
    category: "AI",
  },
  {
    id: "mk-economy",
    name: "매일경제 경제",
    url: "https://www.mk.co.kr/rss/30100041/",
    category: "경제",
  },
  {
    id: "hankyung-economy",
    name: "한국경제",
    url: "https://www.hankyung.com/feed/economy",
    category: "경제",
  },
  {
    id: "fed-press",
    name: "미 연준 보도자료",
    url: "https://www.federalreserve.gov/feeds/press_all.xml",
    category: "경제",
  },
  {
    id: "platum",
    name: "플래텀",
    url: "https://platum.kr/feed",
    category: "창업",
  },
  {
    id: "tubefilter",
    name: "Tubefilter",
    url: "https://www.tubefilter.com/feed/",
    category: "크리에이터 이코노미",
  },
  // NOTE: 기상청의 옛 RSS 엔드포인트(rss.jsp, mid-term-rss3.jsp)는 현재 전부
  // "RSS 서비스 안내" 페이지로 리다이렉트되어 더 이상 실제 피드를 내려주지 않습니다.
  // 유효한 대체 RSS 주소를 알려주시면 다시 활성화하겠습니다.
  // {
  //   id: "weather-kma",
  //   name: "기상청 날씨",
  //   url: "https://www.weather.go.kr/plus/rss.jsp",
  //   category: "날씨",
  // },
  {
    id: "gov-support",
    name: "정부지원정책",
    url: `https://news.google.com/rss/search?q=${encodeURIComponent(
      '"지원사업" 공고 OR 모집'
    )}&hl=ko&gl=KR&ceid=KR:ko`,
    category: "정부지원정책",
  },
  {
    id: "geeknews",
    name: "긱뉴스(GeekNews)",
    url: "https://news.hada.io/rss/news",
    category: "개발",
  },
];
