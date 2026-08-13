WidgetMetadata = {
  id: "forward.universal_list",
  title: "全平台片单解析",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "支持解析 豆瓣、IMDb、TMDB 的片单链接",
  author: "Jacob",
  site: "https://github.com/ifflagged/Neverflagged",
  modules: [
    {
      id: "list",
      title: "提取片单",
      functionName: "fetchList", // 对应下方的异步函数名
      params: [
        {
          name: "url",
          title: "片单地址",
          type: "input",
          description: "支持 TMDB, 豆瓣, IMDb 链接",
          placeholders: [
            { title: "TMDB 历届奥斯卡最佳影片", value: "https://www.themoviedb.org/list/28-best-picture-winners" },
            { title: "豆瓣电影 Top 250", value: "https://m.douban.com/subject_collection/movie_top250" },
            { title: "豆瓣 全球口碑剧集榜", value: "https://m.douban.com/subject_collection/tv_global_best_weekly" },
            { title: "豆瓣 华语口碑剧集榜", value: "https://m.douban.com/subject_collection/tv_chinese_best_weekly" },
            { title: "豆瓣 国内口碑综艺榜", value: "https://m.douban.com/subject_collection/show_chinese_best_weekly" },
            { title: "IMDb Top 250 movies", value: "https://www.imdb.com/chart/top" }, // 这里补上了逗号
            { title: "IMDb Top 250 TV shows", value: "https://www.imdb.com/chart/toptv" }
          ],
        }
      ],
    }
  ],
};

async function fetchList(params) {
  const url = params.url;
  if (!url) throw new Error("请输入链接");

  console.log("正在请求地址:", url);
  
  const response = await Widget.http.get(url, {
    headers: { 
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" 
    }
  });
  
  if (!response || !response.data) {
    throw new Error("网页请求失败");
  }

  const $ = Widget.html.load(response.data);
  let results = [];

  // --- TMDB 解析 ---
  if (url.includes("themoviedb.org")) {
    $(".block.aspect-poster").each((i, el) => {
      const link = $(el).attr("href");
      const match = link.match(/^\/(movie|tv)\/([^\/-]+)-/);
      if (match) {
        results.push({ id: `${match[1]}.${match[2]}`, type: "tmdb" });
      }
    });
  } 
  // --- 豆瓣解析 (
