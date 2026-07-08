const { url } = $request
let headers

switch (true) {
  // 美劇星球播放防盜
  case url.includes('tencent-1257389134'):
    headers = getHeaders($response)
    headers['content-type'] = 'application/vnd.apple.mpegURL'
    $done({ headers: headers })
    break
  case url.includes('42.157.129.29:2222'):
    headers = getHeaders($response)
    headers['content-type'] = 'application/vnd.apple.mpegURL'
    $done({ headers: headers })
    break
  // 短劇天堂添加 referer
  case url.includes('api.emasmr.com'):
    headers = getHeaders($request)
    headers['user-agent'] =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
    headers['referer'] = 'https://duanjutt.tv/'
    $done({ headers: headers })
    break
  case url.includes('hd.suxun.site'):
    let obj = JSON.parse($response.body)

    let playlist = obj.list[0].vod_play_url.split('#')
    let newPlaylist = []
    playlist.forEach((e) => {
      let url = e.split('$')[1]
      url =
        'https://ykusu.ykusu/sx/provide/vod?ac=play&url=' +
        encodeURIComponent(url) +
        '&n=.m3u8'
      newPlaylist.push(e.split('$')[0] + '$' + url)
    })
    obj.list[0].vod_play_url = newPlaylist.join('#')

    $done({ body: JSON.stringify(obj) })
    break
  case url.includes('ppvod01.blbtgg.com'):
    headers = getHeaders($request)
    headers['user-agent'] =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
    headers['referer'] = 'https://www.ghw9zwp5.com/'
    $done({ headers: headers })
    break
  case url.includes('vipcj.timizy.top'):
    try {
      let obj = JSON.parse($response.body)

      let playlist = obj.list[0].vod_play_url.split('#')
      let newPlaylist = []
      playlist.forEach((e) => {
        let url = e.split('$')[1]
        url =
          'https://ykusu.ykusu/mgtimi/provide/vod?ac=play&url=' +
          encodeURIComponent(url) +
          '&n=.m3u8'
        newPlaylist.push(e.split('$')[0] + '$' + url)
      })
      obj.list[0].vod_play_url = newPlaylist.join('#')

      $done({ body: JSON.stringify(obj) })
    } catch (e) {
      $.log(e)
      $.done({})
    }

    break
  case url.includes('dsakf23665'):
    try {
      let obj = JSON.parse($response.body)

      let playlist = obj.list[0].vod_play_url.split('#')
      let from = obj.list[0].vod_play_from
      let id = obj.list[0].vod_id
      let newPlaylist = []
      playlist.forEach((e) => {
        let url = e.split('$')[1]
        url =
          'https://ykusu.ykusu/dsakf23665/provide/vod?ac=play&url=' +
          id +
          '@@@' +
          from +
          '@@@' +
          encodeURIComponent(url) +
          '&n=.m3u8'
        newPlaylist.push(e.split('$')[0] + '$' + url)
      })
      obj.list[0].vod_play_url = newPlaylist.join('#')

      $done({ body: JSON.stringify(obj) })
    } catch (e) {
      $.log(e)
      $.done({})
    }

    break
  default:
    $done({})
    break
}

function getHeaders(obj) {
  let headers = {}
  for (let key in obj.headers) {
    headers[key.toLowerCase()] = obj.headers[key]
  }
  return headers
}
